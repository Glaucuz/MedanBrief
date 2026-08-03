import type { Express, Request } from "express";
import type { Server } from "http";
import multer from "multer";
import XLSX from "xlsx";
import pLimit from "p-limit";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as cheerio from "cheerio";

const HF_MODEL = process.env.HF_MODEL || "cahya/t5-base-indonesian-summarization-cased";
const HF_API_KEY = process.env.HF_API_KEY || process.env.HUGGINGFACEHUB_API_TOKEN || process.env.HF_TOKEN;

const ALLOWED_DOMAINS = [
  "medan.tribunnews.com",
  "www.detik.com",
  "detik.com",
  "www.kompas.com",
  "kompas.com",
  "waspada.co.id",
  "www.waspada.co.id",
];

function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

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

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("head title").text() ||
      $("h1").first().text() ||
      "Judul tidak ditemukan";

    const cleanTitle = title
      .replace(/\b(?:[A-Za-z0-9-]+\.)+(?:com|co\.id|id|net|org|info|biz|news)\b/gi, " ")
      .replace(/\s+\.com(?:\s|-|$)/gi, " ")
      .replace(/\s+\.co\.id(?:\s|-|$)/gi, " ")
      .replace(/\s+\.id(?:\s|-|$)/gi, " ")
      .replace(/\s+\.net(?:\s|-|$)/gi, " ")
      .replace(/\s+\.org(?:\s|-|$)/gi, " ")
      .replace(/\s+\.info(?:\s|-|$)/gi, " ")
      .replace(/^[a-zA-Z0-9\-.]+ - /i, "")
      .trim();

$(
  `
  script,
  style,
  iframe,
  noscript,
  svg,
  nav,
  footer,
  header,
  aside,
  form,
  button,
  .ads,
  .advertisement,
  .social-share,
  .related-articles
`
).remove();

const selectors = [
  ".txt-article",
  ".side-article",
  ".detail-text",
  ".article-content",
  ".content-detail",
  ".read__content",
  ".mat-article-body",
  "article",
  "main"
];

let content = "";

for (const selector of selectors) {
  const text = $(selector).text().trim();

  if (text.length > 500) {
    content = text;
    break;
  }
}

if (!content) {
  content = $("body").text();
}

content = content
  .replace(/GTM-[A-Z0-9]+/g, "")
  .replace(/display:none/gi, "")
  .replace(/visibility:hidden/gi, "")
  .replace(/iframe/gi, "")
  .replace(/Google Tag Manager/gi, "")
  .replace(/ADVERTISEMENT/gi, "")
  .replace(/https?:\/\/[^\s]+/gi, "")
  .replace(/www\.[^\s]+/gi, "")
  .replace(/\b(?:[A-Za-z0-9-]+\.)+(?:com|co\.id|id|net|org|info|biz|news)\b/gi, "")
  .replace(/[a-zA-Z0-9\-.]+ - /gi, "")
  .replace(/\s+\.com(?:\s|-|$)/gi, " ")
  .replace(/\s+\.co\.id(?:\s|-|$)/gi, " ")
  .replace(/\s+\.id(?:\s|-|$)/gi, " ")
  .replace(/\s+\.net(?:\s|-|$)/gi, " ")
  .replace(/\s+\.org(?:\s|-|$)/gi, " ")
  .replace(/\s+\.info(?:\s|-|$)/gi, " ")
  .replace(/\s+\.news(?:\s|-|$)/gi, " ")
  .replace(/\s+/g, " ")
  .trim(); 

    if (!content || content.length < 50) {
      throw new Error("Konten artikel tidak dapat diekstrak dari URL tersebut.");
    }

    return { title: cleanTitle, content };
  } catch (error) {
    throw new Error(
      `Tidak dapat mengambil artikel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function cleanSummaryText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/www\.[^\s]+/gi, "")
    .replace(/\b(?:[A-Za-z0-9-]+\.)+(?:com|co\.id|id|net|org|info|biz|news)\b/gi, "")
    .replace(/\s+\.com(?:\s|-|$)/gi, " ")
    .replace(/\s+\.co\.id(?:\s|-|$)/gi, " ")
    .replace(/\s+\.id(?:\s|-|$)/gi, " ")
    .replace(/\s+\.net(?:\s|-|$)/gi, " ")
    .replace(/\s+\.org(?:\s|-|$)/gi, " ")
    .replace(/\s+\.info(?:\s|-|$)/gi, " ")
    .replace(/\s+\.biz(?:\s|-|$)/gi, " ")
    .replace(/\s+\.news(?:\s|-|$)/gi, " ")
    .replace(/^[a-zA-Z0-9\-.]+ - /i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function summarizeWithHf(title: string, content: string): Promise<string> {
  const truncatedContent = content.split(" ").slice(0, 3000).join(" ");
  const input = `${title}\n\n${truncatedContent}`;

  if (!HF_API_KEY) {
    throw new Error("HF_API_KEY tidak ditemukan. Tambahkan HF_API_KEY ke file .env");
  }

  try {
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: input,
        parameters: {
          max_length: 1000,
          max_new_tokens: 512,
          min_length: 80,
          num_beams: 6,
          length_penalty: 0.9,
          no_repeat_ngram_size: 3,
          early_stopping: true,
          do_sample: false,
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Hugging Face inference gagal (${res.status}): ${txt}`);
    }

    const data = await res.json();

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
      throw new Error("Hugging Face mengembalikan ringkasan kosong.");
    }

    return cleanSummaryText(summaryText);
  } catch (err) {
    console.error("Error calling Hugging Face inference API:", err);
    throw err;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.summaries.list.path, async (req, res) => {
    const summaries = await storage.getSummaries();
    res.json(summaries);
  });

  app.post(api.summaries.summarize.path, async (req, res) => {
    try {
      const input = api.summaries.summarize.input.parse(req.body);
      const { url } = input;

      if (!isAllowedUrl(url)) {
        return res.status(400).json({
          message: "Hanya artikel dari medan.tribunnews.com, detik.com, kompas.com, dan waspada.co.id yang dapat diproses.",
        });
      }

      const { title, content } = await fetchArticleContent(url);

      console.log("TITLE:", title);
      console.log("CONTENT PREVIEW:");
      console.log(content.substring(0, 1500));

      const summaryText = await summarizeWithHf(title, content);

      const summary = await storage.createSummary({
        url,
        title,
        summary: summaryText,
        originalContent: content.slice(0, 5000),
        source: "link",
      });

      res.json(summary);
    } catch (err) {
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

      const urls = Array.from(candidateUrls).filter(isAllowedUrl);
      if (!urls.length) {
        return res.status(400).json({ message: "Tidak ada URL dari website yang diizinkan (medan.tribunnews.com, detik.com, kompas.com, waspada.co.id) ditemukan di file Excel." });
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
              source: "csv",
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
