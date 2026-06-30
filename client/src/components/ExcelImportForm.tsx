import { useState, type FormEvent, type ChangeEvent } from "react";
import { ArrowUpRight, FileSpreadsheet, Loader2, XCircle } from "lucide-react";
import { useImportSummaries } from "@/hooks/use-summaries";
import { useToast } from "@/hooks/use-toast";
import { type Summary } from "@shared/schema";

interface ExcelImportFormProps {
  onSuccess: (result: { summaries: Summary[]; errors?: Array<{ url: string; message: string }> }) => void;
}

export function ExcelImportForm({ onSuccess }: ExcelImportFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { mutate, isPending } = useImportSummaries();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setResultMessage(null);
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFileError(null);
    setResultMessage(null);

    if (!selectedFile) {
      setFileError("Pilih file Excel (.xlsx atau .csv) yang berisi link berita.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    mutate(formData, {
      onSuccess: (data) => {
        setSelectedFile(null);
        if (data.errors?.length) {
          setResultMessage(`Imported ${data.summaries.length} summaries, but ${data.errors.length} links failed.`);
        } else {
          setResultMessage(`Imported ${data.summaries.length} summaries successfully.`);
        }
        onSuccess(data);
      },
      onError: (error) => {
        setFileError(error instanceof Error ? error.message : "Gagal mengimpor file Excel.");
      },
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card/80 p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Import Excel berisi link berita</h3>
            <p className="text-sm text-muted-foreground">Unggah file .xlsx atau .csv, AI akan membuat ringkasan untuk setiap link.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="flex flex-col gap-2 rounded-2xl border border-border/80 p-4 bg-background cursor-pointer hover:border-primary transition-colors">
            <span className="text-sm font-medium text-foreground">Pilih file Excel</span>
            <span className="text-xs text-muted-foreground">Format pertama dengan header URL/link akan otomatis diproses.</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={isPending}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mt-2 text-sm text-primary font-medium">{selectedFile?.name ?? "Tidak ada file terpilih"}</div>
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses
              </>
            ) : (
              <>
                Upload & Summarize <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {fileError && (
          <div className="mt-4 rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {fileError}
            </div>
          </div>
        )}

        {resultMessage && (
          <div className="mt-4 rounded-2xl bg-secondary/10 border border-secondary/20 p-3 text-sm text-secondary-foreground">
            {resultMessage}
          </div>
        )}
      </form>
    </div>
  );
}
