// Shared types for the application.  This file no longer relies on any database library;
// data is stored/validated via plain objects and Zod schemas.
import { z } from "zod";

// -------- summaries ------------------------------------------------------
export const summarySchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  summary: z.string(),
  originalContent: z.string().optional(),
  source: z.enum(["link", "csv"]).optional().default("link"),
  createdAt: z.string(), // ISO timestamp
});

export const insertSummarySchema = summarySchema.omit({ id: true, createdAt: true });

export type Summary = z.infer<typeof summarySchema>;
export type InsertSummary = z.infer<typeof insertSummarySchema>;

// Request type for the summarize endpoint
export const summarizeRequestSchema = z.object({
  url: z.string().url(),
});

export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>;

export const importSummariesResponseSchema = z.object({
  summaries: z.array(summarySchema),
  errors: z.array(
    z.object({
      url: z.string(),
      message: z.string(),
    }),
  ).optional(),
});

export type ImportSummariesResponse = z.infer<typeof importSummariesResponseSchema>;

// -------- chat models ----------------------------------------------------
export const conversationSchema = z.object({
  id: z.number(),
  title: z.string(),
  createdAt: z.string(),
});

export const insertConversationSchema = conversationSchema.omit({ id: true, createdAt: true });

export const messageSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const insertMessageSchema = messageSchema.omit({ id: true, createdAt: true });

export type Conversation = z.infer<typeof conversationSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
