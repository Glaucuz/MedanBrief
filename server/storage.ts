import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  type InsertSummary,
  type Summary,
  summarySchema,
} from "@shared/schema";

export interface IStorage {
  createSummary(summary: InsertSummary): Promise<Summary>;
  getSummaries(): Promise<Summary[]>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.join(__dirname, "../data/summaries.json");

async function readAll(): Promise<Summary[]> {
  try {
    const txt = await fs.readFile(FILE_PATH, "utf-8");
    const arr = JSON.parse(txt) as unknown;
    if (Array.isArray(arr)) return arr as Summary[];
  } catch (e) {
    // file might not exist yet
  }
  return [];
}

async function writeAll(summaries: Summary[]) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(summaries, null, 2));
}

export class JsonStorage implements IStorage {
  async createSummary(insertSummary: InsertSummary): Promise<Summary> {
    const items = await readAll();
    const nextId = items.length ? Math.max(...items.map((s) => s.id)) + 1 : 1;
    const newItem: Summary = {
      id: nextId,
      createdAt: new Date().toISOString(),
      ...insertSummary,
    };
    items.push(newItem);
    await writeAll(items);
    return newItem;
  }

  async getSummaries(): Promise<Summary[]> {
    const items = await readAll();
    // sort by createdAt desc
    return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

export const storage = new JsonStorage();
