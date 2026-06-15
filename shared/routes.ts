import { z } from 'zod';
import { summarySchema, insertSummarySchema, summarizeRequestSchema, importSummariesResponseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  summaries: {
    list: {
      method: 'GET' as const,
      path: '/api/summaries' as const,
      responses: {
        200: z.array(summarySchema),
      },
    },
    summarize: {
      method: 'POST' as const,
      path: '/api/summarize' as const,
      input: summarizeRequestSchema,
      responses: {
        200: summarySchema, // Return the stored summary
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/summaries/import' as const,
      responses: {
        200: importSummariesResponseSchema,
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
