# MedanBrief

## Overview

MedanBrief is an AI-powered news summarization application developed as a final year project (skripsi).
The system ingests news articles from various sources, processes them using state-of-the-art natural language
processing models, and returns concise summaries to the user. The resulting summaries help readers quickly
understand the main points of each article without having to read the full content.

## Architecture & Workflow

1. **Data Ingestion**
   - News articles are gathered from configured APIs or stored in `data/summaries.json`.
   - The server (see `server/index.ts`) handles requests and orchestrates data flow.

2. **Processing Pipeline**
   - When a user submits a URL or text via the frontend (`client/src/components/SummarizeForm.tsx`),
     the input is sent to the backend route defined in `shared/routes.ts`.
   - Backend logic in `server/routes.ts` receives the request and forwards the content to the
     summarization service. This may call external AI APIs (e.g. OpenAI) or a local model depending
     on configuration.
   - The AI model analyzes the article, extracts key sentences, and generates a coherent summary.
   - Summaries are stored using the `use-summaries` hook or persistently in `data/summaries.json`.

3. **Frontend Interaction**
   - The React client (entries under `client/src`) displays forms and summary cards (`SummaryCard.tsx`).
   - Summaries are retrieved via `queryClient.ts` using react-query to manage cache and network state.
   - Users can view previous summaries, copy text, or request new ones.

4. **AI Component Details**
   - The core AI runs on transformer models (such as GPT or other seq2seq architectures) capable of
     natural language understanding and text generation.
   - Input text is tokenized and fed to the model; attention mechanisms ensure context awareness.
   - The model generates output tokens that are detokenized back to human-readable language.
   - For thesis documentation, detail is provided on training datasets, evaluation metrics (e.g., ROUGE),
     and fine-tuning steps (if applicable).

## Development & Build

- The project uses Vite with React and TypeScript on the client.
- Tailwind CSS provides styling (see `tailwind.config.ts`).
- The server runs on Deno/Node with TypeScript. Drizzle ORM config is in `drizzle.config.ts`.

## Notes for Thesis

- Describe how each piece of the system contributes to the AI pipeline.
- Include diagrams showing data flow from user input to model inference to UI.
- Document challenges faced during model selection, latency considerations, and how you validated
  summarization quality.

> **Tip**: Copy this README into your report and expand with additional background theory,
> experimental results, and references to relevant literature.
