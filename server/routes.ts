import type { Express, Request } from "express";
import type { Server } from "http";
import multer from "multer";
import XLSX from "xlsx";
import pLimit from "p-limit";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as cheerio from "cheerio";

// Hugging Face inference settings — provide `HF_API_KEY` and optional `HF_MODEL`
// Example: HF_MODEL=sshleifer/distilbart-cnn-12-6
const HF_MODEL = process.env.HF_MODEL || "sshleifer/distilbart-cnn-12-6";
const HF_API_KEY = process.env.HF_API_KEY;

/**
 * Mengambil konten artikel dari URL yang diberikan.
 * Menggunakan cheerio untuk melakukan scraping HTML dan mengekstrak
 * judul serta isi utama artikel.
 */
async function fetchArticleContent(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://www.google.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Ekstrak judul artikel
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("head title").text() ||
      $("h1").first().text() ||
      "Judul tidak ditemukan";

    // Hapus elemen yang tidak relevan
    $("script, style, nav, footer, header, aside, .ads, .advertisement, .social-share, .related-articles").remove();

    // Coba ambil konten utama dari berbagai selector umum portal berita Indonesia
    let content =
      $("article").text() ||
      $(".detail-text").text() ||        // Tribun, detik
      $(".article-content").text() ||    // berbagai portal
      $(".content-detail").text() ||     // Kompas
      $(".read__content").text() ||      // Kompas.com
      $(".mat-article-body").text() ||
      $("main").text() ||
      $("body").text();

    // Bersihkan whitespace berlebih
    content = content.replace(/\s+/g, " ").trim();

    if (!content || content.length < 50) {
      throw new Error("Konten artikel tidak dapat diekstrak dari URL tersebut.");
    }

    return { title: title.trim(), content };
  } catch (error) {
    throw new Error(
      `Tidak dapat mengambil artikel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Membuat ringkasan artikel menggunakan Groq (LLaMA 3).
 *
 * Langkah-langkah Proses (untuk Skripsi):
 * 1. Tokenisasi: Teks input dikonversi menjadi token oleh model LLaMA 3.
 * 2. Truncation: Konten dipotong agar tidak melebihi batas context window model.
 * 3. Inferensi (Decoder-only / Autoregressive):
 *    - Model LLaMA 3 memproses seluruh konteks input sekaligus menggunakan
 *      attention mechanism.
 *    - Output dihasilkan token demi token secara autoregresif di atas
 *      hardware Groq LPU (Language Processing Unit).
 * 4. Prompt Engineering: System prompt dirancang agar model menghasilkan
 *    ringkasan dalam Bahasa Indonesia yang informatif dan ringkas.
 */
function extractiveSummary(title: string, content: string): string {
  // Simple extractive fallback: pick up to 3 leading sentences of reasonable length
  try {
    const text = `${title}. ${content}`.replace(/\s+/g, " ").trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const good = sentences.filter((s) => s.trim().length > 30);
    const chosen = good.length ? good.slice(0, 3) : sentences.slice(0, 3);
    const joined = chosen.join(" ").trim();
    if (joined.length > 0) return joined;
    return text.slice(0, 300) + (text.length > 300 ? "..." : "");
  } catch (e) {
    return (title || "") + " - " + (content.slice(0, 280) || "");
  }
}

async function summarizeWithHf(title: string, content: string): Promise<string> {
  // If HF key not provided, fall back to extractive summarizer to avoid 401/500
  if (!HF_API_KEY) {
    console.warn("HF_API_KEY not set — using extractive fallback summarizer.");
    return extractiveSummary(title, content);
  }

  // Truncate content to a reasonable length for the model's context window
  const truncatedContent = content.slice(0, 2000);
  const input = `${title}\n\n${truncatedContent}`;

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: input,
        parameters: {
          max_length: 256,
          min_length: 30,
          do_sample: false,
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn(`HF inference returned ${res.status}: ${txt}. Falling back to extractive summarizer.`);
      return extractiveSummary(title, content);
    }

    const data = await res.json();

    // The inference API may return an array with `summary_text` or plain string
    let summaryText = "";
    if (Array.isArray(data)) {
      if (data[0] && typeof data[0] === "object" && "summary_text" in data[0]) {
        summaryText = (data[0] as any).summary_text;
      } else if (typeof data[0] === "string") {
        summaryText = data[0];
      } else {
        summaryText = JSON.stringify(data[0]);
      }
    } else if (typeof data === "object" && data !== null && "summary_text" in data) {
      summaryText = (data as any).summary_text;
    } else if (typeof data === "string") {
      summaryText = data;
    } else {
      summaryText = JSON.stringify(data);
    }

    summaryText = String(summaryText).trim();
    if (!summaryText) {
      console.warn("HF returned empty summary — using extractive fallback.");
      return extractiveSummary(title, content);
    }

    return summaryText;
  } catch (err) {
    console.error("Error calling Hugging Face inference API:", err);
    return extractiveSummary(title, content);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET /api/summaries - Ambil semua ringkasan yang tersimpan
  app.get(api.summaries.list.path, async (req, res) => {
    const summaries = await storage.getSummaries();
    res.json(summaries);
  });

  // POST /api/summarize - Proses URL berita dan buat ringkasan
  app.post(api.summaries.summarize.path, async (req, res) => {
    try {
      // 1. Validasi input
      const input = api.summaries.summarize.input.parse(req.body);
      const { url } = input;

      // 2. Ambil konten artikel dari URL
      const { title, content } = await fetchArticleContent(url);

      // 3. Buat ringkasan menggunakan Hugging Face Inference API
      const summaryText = await summarizeWithHf(title, content);

      // 4. Simpan hasil ke storage (JSON file)
      const summary = await storage.createSummary({
        url,
        title,
        summary: summaryText,
        originalContent: content.slice(0, 5000),
      });

      res.json(summary);
    } catch (err) {
      console.error("Summarization error:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      res.status(500).json({
        message: err instanceof Error ? err.message : "Terjadi kesalahan internal server",
      });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post(api.summaries.import.path, upload.single("file"), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File Excel tidak ditemukan dalam permintaan." });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        return res.status(400).json({ message: "File Excel tidak berisi lembar kerja yang valid." });
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const candidateUrls = new Set<string>();

      const addUrl = (value: unknown) => {
        if (!value) return;
        const raw = String(value).trim();
        try {
          const normalized = new URL(raw).href;
          if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            candidateUrls.add(normalized);
          }
        } catch {
          try {
            const normalized = new URL(`https://${raw}`).href;
            candidateUrls.add(normalized);
          } catch {
            // ignore invalid strings
          }
        }
      };

      const urlHeader = Object.keys(rows[0] ?? {}).find((key) => /url|link|tautan|website/i.test(key));
      if (urlHeader) {
        rows.forEach((row) => addUrl(row[urlHeader]));
      } else {
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
        rawRows.forEach((row) => {
          row.forEach(addUrl);
        });
      }

      const urls = Array.from(candidateUrls);
      if (!urls.length) {
        return res.status(400).json({ message: "Tidak ada URL berita yang valid ditemukan di file Excel." });
      }

      const limit = pLimit(3);
      const results = await Promise.allSettled(
        urls.map((url) =>
          limit(async () => {
            const { title, content } = await fetchArticleContent(url);
            const summaryText = await summarizeWithHf(title, content);
            return storage.createSummary({
              url,
              title,
              summary: summaryText,
              originalContent: content.slice(0, 5000),
            });
          }),
        ),
      );

      const summaries = [] as Array<Awaited<ReturnType<typeof storage.createSummary>>>;
      const errors = [] as Array<{ url: string; message: string }>;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          summaries.push(result.value);
        } else {
          errors.push({
            url: urls[index],
            message: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      });

      res.json({ summaries, errors: errors.length ? errors : undefined });
    } catch (err) {
      console.error("Excel import error:", err);
      res.status(500).json({
        message: err instanceof Error ? err.message : "Terjadi kesalahan internal server saat mengimpor file.",
      });
    }
  });

  return httpServer;
}
