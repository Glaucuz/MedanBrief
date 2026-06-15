import * as cheerio from "cheerio";
import { pipeline, env } from "@xenova/transformers";

// Nonaktifkan pencarian model lokal jika tidak ada, paksa download dari remote
env.allowLocalModels = false;
env.useBrowserCache = false;

// Initialize the summarization pipeline
let summarizer: any = null;

export async function getSummarizer() {
  if (!summarizer) {
    console.log("Loading Indonesian summarization model...");
    try {
      summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6');
      console.log("Model loaded successfully.");
    } catch (error) {
      console.error("Failed to load model:", error);
      throw error;
    }
  }
  return summarizer;
}

export async function fetchArticleContent(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic extraction heuristics
    const title = $('head title').text() || $('h1').first().text() || "No title found";
    
    // Remove scripts, styles, etc.
    $('script, style, nav, footer, header, aside').remove();
    
    // Try to find the main article content
    let content = $('article').text();
    if (!content || content.length < 100) {
      content = $('main').text();
    }
    if (!content || content.length < 100) {
      content = $('body').text();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    return { title, content };
  } catch (error) {
    throw new Error(`Could not fetch article: ${error instanceof Error ? error.message : String(error)}`);
  }
}
