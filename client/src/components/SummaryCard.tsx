import { useState } from "react";
import { type Summary } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Clock, FileText, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SummaryCardProps {
  summary: Summary;
  index: number;
}

export function SummaryCard({ summary, index }: SummaryCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="group relative flex flex-col justify-between h-full bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md hover:border-border transition-all duration-300"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              <Clock className="w-3 h-3" />
              {summary.createdAt ? formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true }) : 'Just now'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted"
                title="View full summary"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <a
                href={summary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-primary/80 transition-colors line-clamp-2">
            {summary.title}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 mb-4">
            {summary.summary}
          </p>
        </div>

        <div className="pt-4 mt-auto border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{new URL(summary.url).hostname}</span>
          </div>
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{summary.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {summary.createdAt ? formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true }) : 'Just now'}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <a
                  href={summary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {new URL(summary.url).hostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-foreground">Summary</h4>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {summary.summary}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
