import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type SummarizeRequest, type ImportSummariesResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSummaries() {
  return useQuery({
    queryKey: [api.summaries.list.path],
    queryFn: async () => {
      const res = await fetch(api.summaries.list.path);
      if (!res.ok) throw new Error("Failed to fetch recent summaries");
      return api.summaries.list.responses[200].parse(await res.json());
    },
  });
}

export function useSummarize() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SummarizeRequest) => {
      const res = await fetch(api.summaries.summarize.path, {
        method: api.summaries.summarize.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.summaries.summarize.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 500) {
           const error = api.summaries.summarize.responses[500].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to summarize article");
      }

      return api.summaries.summarize.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.summaries.list.path] });
      toast({
        title: "Summary Ready",
        description: "The article has been successfully summarized.",
      });
    },
    onError: (error) => {
      toast({
        title: "Summarization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useImportSummaries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.summaries.import.path, {
        method: api.summaries.import.method,
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to import Excel file.");
      }

      return api.summaries.import.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.summaries.list.path] });
      toast({
        title: "Import Success",
        description: "Excel links have been processed and summaries are ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unable to import the Excel file.",
        variant: "destructive",
      });
    },
  });
}
