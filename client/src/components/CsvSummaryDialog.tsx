import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Summary } from "@shared/schema";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const slideVariants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 80 : -80 }),
  enter: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -80 : 80 }),
};

interface CsvSummaryDialogProps {
  summaries: Summary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvSummaryDialog({ summaries, open, onOpenChange }: CsvSummaryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const currentSummary = summaries[currentIndex];

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setDirection(1);
    }
  }, [open, summaries]);

  if (!currentSummary) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
        <div className="bg-card rounded-3xl border border-border p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-serif text-2xl">Ringkasan CSV</DialogTitle>
              <DialogDescription>
                <p className="text-sm text-muted-foreground">
                  Menampilkan {currentIndex + 1} dari {summaries.length} berita. Gunakan tombol untuk melihat slide berikutnya.
                </p>
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Tutup dialog ringkasan CSV"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-6 min-h-[340px] overflow-hidden rounded-3xl border border-border/60 bg-background p-6">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={`${currentSummary.id ?? currentIndex}-${currentIndex}`}
                custom={direction}
                variants={slideVariants}
                initial="hidden"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{currentSummary.title}</h3>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new URL(currentSummary.url).hostname}
                        </p>
                      </div>
                      <a
                        href={currentSummary.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
                      >
                        Buka Artikel <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {currentSummary.summary}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                    <div className="rounded-2xl border border-border/70 bg-muted px-4 py-3 text-sm text-muted-foreground">
                      {currentSummary.createdAt
                        ? `Dibuat ${new Date(currentSummary.createdAt).toLocaleString()}`
                        : "Baru saja dibuat"}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>{currentIndex + 1} / {summaries.length}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => {
                  setDirection(-1);
                  setCurrentIndex((value) => Math.max(value - 1, 0));
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentIndex >= summaries.length - 1}
                onClick={() => {
                  setDirection(1);
                  setCurrentIndex((value) => Math.min(value + 1, summaries.length - 1));
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Tutup
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
