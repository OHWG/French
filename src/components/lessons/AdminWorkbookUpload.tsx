"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminWorkbookUpload({
  cefrLevel,
  existingTitle,
}: {
  cefrLevel: string;
  existingTitle?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "text">("text");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("cefrLevel", cefrLevel);
    fd.set("inputMode", mode);
    const res = await fetch("/api/workbooks", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Upload failed");
    } else {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-blue-600 hover:underline">
        {existingTitle ? "Replace workbook" : "Upload workbook"}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <input
        name="title"
        required
        defaultValue={existingTitle}
        placeholder={`${cefrLevel} Workbook title`}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Mode toggle */}
      <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
        <button type="button" onClick={() => setMode("text")}
          className="flex-1 py-1.5 font-medium transition"
          style={{ background: mode === "text" ? "#003189" : "white", color: mode === "text" ? "white" : "#374151" }}>
          Paste text
        </button>
        <button type="button" onClick={() => setMode("file")}
          className="flex-1 py-1.5 font-medium transition"
          style={{ background: mode === "file" ? "#003189" : "white", color: mode === "file" ? "white" : "#374151" }}>
          Upload file
        </button>
      </div>

      {mode === "text" ? (
        <div>
          <textarea
            name="pastedText"
            required
            rows={8}
            placeholder="Open the workbook PDF in any reader, select all text (Cmd+A / Ctrl+A), copy, and paste here."
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          <p className="text-xs text-gray-400 mt-0.5">Tip: paste as much text as possible — the AI uses this as context when generating exercises.</p>
        </div>
      ) : (
        <div>
          <input
            name="file"
            type="file"
            accept=".pdf,.docx,.doc"
            required={mode === "file"}
            className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
          />
          <p className="text-xs text-gray-400 mt-0.5">Max 4MB. For larger files use Paste text instead.</p>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50">
          {loading ? "Saving…" : "Save workbook"}
        </button>
      </div>
    </form>
  );
}
