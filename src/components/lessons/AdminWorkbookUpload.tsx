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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("cefrLevel", cefrLevel);
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
        {existingTitle ? "Replace workbook" : "Upload workbook PDF"}
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
      <input
        name="file"
        type="file"
        accept=".pdf"
        required
        className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50">
          {loading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </form>
  );
}
