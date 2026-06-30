import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SummarizeRequest, summarizeRequestSchema } from "@shared/schema";
import { useSummarize } from "@/hooks/use-summaries";
import { Loader2, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function SummarizeForm({ onSuccess }: { onSuccess: (summary: any) => void }) {
  const { mutate, isPending } = useSummarize();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<SummarizeRequest>({
    resolver: zodResolver(summarizeRequestSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = (data: SummarizeRequest) => {
    setError(null);
    mutate(data, {
      onSuccess: (result) => {
        form.reset();
        onSuccess(result);
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || err.message || "Could not summarize this article.";
        setError(message);
      }
    });
  };

  const copyError = () => {
    if (error) {
      navigator.clipboard.writeText(error);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Error message copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative group">
        <div className="relative flex items-center">
          <input
            {...form.register("url")}
            disabled={isPending}
            placeholder="Paste a news article URL (e.g., https://medan.tribunnews.com/...)"
            className="w-full h-16 pl-6 pr-36 rounded-2xl border-2 border-border bg-background text-lg shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          />
          
          <div className="absolute right-2 flex items-center">
            <button
              type="submit"
              disabled={isPending || !form.formState.isValid}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg transition-all duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Summarize</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {form.formState.errors.url && (
            <motion.p
              key="url-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-6 left-6 text-sm text-destructive font-medium"
            >
              {form.formState.errors.url.message}
            </motion.p>
          )}
          {error && (
            <motion.div
              key="api-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-10 left-6 right-6 flex items-center justify-between gap-4 p-2 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <p className="text-xs text-destructive font-medium truncate flex-1">
                {error}
              </p>
              <button
                type="button"
                onClick={copyError}
                className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/20 text-destructive text-[10px] font-bold hover:bg-destructive/30 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "COPIED" : "COPY ERROR"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
