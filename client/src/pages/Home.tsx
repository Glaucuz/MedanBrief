import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SummarizeForm } from "@/components/SummarizeForm";
import { ExcelImportForm } from "@/components/ExcelImportForm";
import { SummaryCard } from "@/components/SummaryCard";
import { CsvSummaryDialog } from "@/components/CsvSummaryDialog";
import { useSummaries } from "@/hooks/use-summaries";
import { type Summary } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ArrowDown, Quote } from "lucide-react";

export default function Home() {
  const { data: summaries, isLoading } = useSummaries();
  const [latestSummary, setLatestSummary] = useState<Summary | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 9;

  const linkSummaries = summaries ? summaries.filter((summary) => (summary.source ?? "link") === "link") : [];
  const csvHistory = summaries ? summaries.filter((summary) => summary.source === "csv") : [];
  const pagedSummaries = linkSummaries.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(linkSummaries.length / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSummaryCreated = (summary: Summary) => {
    setLatestSummary(summary);
    setPage(1);
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvSummaries, setCsvSummaries] = useState<Summary[]>([]);

  const handleSummariesImported = (result: { summaries: Summary[] }) => {
    if (result.summaries.length > 0) {
      handleSummaryCreated(result.summaries[0]);
      setCsvSummaries(result.summaries);
      setCsvDialogOpen(true);
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background Decor */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
            </svg>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6 text-primary leading-[1.1]">
                  Local News, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 italic">
                    Distilled.
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Paste a link to any Medan local news article. 
                  Our AI will read, analyze, and extract the key points in seconds.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SummarizeForm onSuccess={handleSummaryCreated} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <ExcelImportForm onSuccess={handleSummariesImported} />
            </motion.div>
          </div>
        </section>

        {/* Latest Result Section */}
        <AnimatePresence mode="wait">
          {latestSummary && (
            <motion.section 
              id="result-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent/30 border-y border-border"
            >
              <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 mb-8 justify-center text-primary/60">
                    <ArrowDown className="animate-bounce" />
                    <span className="text-sm font-semibold tracking-widest uppercase">Latest Analysis</span>
                    <ArrowDown className="animate-bounce" />
                  </div>

                  <div className="bg-card rounded-2xl shadow-xl border border-border p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-6 left-6 opacity-10">
                      <Quote className="w-24 h-24" />
                    </div>
                    
                    <div className="relative z-10">
                      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-primary">
                        {latestSummary.title}
                      </h2>
                      <div className="prose prose-lg text-foreground/80 max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {latestSummary.summary}
                        </p>
                      </div>
                      
                      <div className="mt-8 pt-8 border-t border-border flex items-center justify-between">
                         <div className="text-sm text-muted-foreground">
                            Generated just now
                         </div>
                         <a 
                           href={latestSummary.url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                         >
                           Read original article <FileText className="w-4 h-4" />
                         </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <CsvSummaryDialog
          summaries={csvSummaries}
          open={csvDialogOpen}
          onOpenChange={setCsvDialogOpen}
        />

        {/* Recent Summaries Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-serif text-3xl font-bold">Recent Briefs</h2>
              <div className="h-px flex-1 bg-border ml-8 hidden md:block" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-serif text-2xl font-semibold">History Link Langsung</h3>
                      <p className="text-sm text-muted-foreground">{linkSummaries.length} ringkasan dari link langsung</p>
                    </div>
                  </div>

                  {linkSummaries.length === 0 ? (
                    <div className="rounded-3xl border border-border/70 bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                      Belum ada riwayat ringkasan dari link langsung.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pagedSummaries.map((summary, index) => (
                        <SummaryCard key={summary.id} summary={summary} index={index} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-10">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-serif text-2xl font-semibold">History Upload CSV</h3>
                      <p className="text-sm text-muted-foreground">{csvHistory.length} ringkasan dari file CSV</p>
                    </div>
                  </div>

                  {csvHistory.length === 0 ? (
                    <div className="rounded-3xl border border-border/70 bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                      Belum ada riwayat ringkasan dari upload CSV.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {csvHistory.map((summary, index) => (
                        <SummaryCard key={summary.id} summary={summary} index={index} />
                      ))}
                    </div>
                  )}
                </div>

                {summaries?.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No summaries yet</h3>
                    <p className="text-muted-foreground mt-1">Be the first to summarize an article!</p>
                  </div>
                )}

                {linkSummaries.length > perPage && (
                  <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {Math.min((page - 1) * perPage + 1, summaries.length)} sampai {Math.min(page * perPage, summaries.length)} dari {summaries.length} ringkasan
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        className="rounded-xl border border-border/70 px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-foreground/80">Page {page} of {totalPages}</span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        className="rounded-xl border border-border/70 px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-background text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} MedanBrief. Powered by AI Abstractive Summarization.</p>
        </div>
      </footer>
    </div>
  );
}
