"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PDF_TEXT_WARNING_THRESHOLD = 200; // chars

interface Workbook { id: string; cefrLevel: string; title: string }

export default function NewLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [inputMode, setInputMode] = useState<"pdf" | "text">("pdf");
  const [pdfWarning, setPdfWarning] = useState(false);

  useEffect(() => {
    fetch("/api/workbooks")
      .then((r) => r.json())
      .then(setWorkbooks)
      .catch(() => {});
  }, []);

  const matchedWorkbook = workbooks.find((w) => w.cefrLevel === selectedLevel);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".doc")) return;
    // Quick client-side size heuristic: small PDFs may be scanned images
    if (file.size < 50 * 1024) {
      setPdfWarning(true);
    } else {
      setPdfWarning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    if (matchedWorkbook) fd.set("workbookId", matchedWorkbook.id);
    fd.set("inputMode", inputMode);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Upload failed");
      setLoading(false);
    } else {
      const { lessonId } = await res.json();
      router.push(`/lessons/${lessonId}`);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#003189" }}>Upload lesson notes</h1>
      <p className="text-gray-500 text-sm mb-8">
        Upload a PDF or paste your notes directly. AI will generate exercises and flashcards for you.
      </p>

      {error && (
        <p className="text-sm rounded-lg px-4 py-2 mb-4" style={{ background: "#ffeef0", color: "#c62828" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lesson title</label>
          <input
            name="title"
            required
            placeholder="e.g. Week 3 — Le passé composé"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEFR level</label>
            <select
              name="cefrLevel"
              required
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week number</label>
            <input
              name="weekNumber"
              type="number"
              min="1"
              placeholder="e.g. 3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            name="topic"
            placeholder="e.g. Irregular verbs, Numbers, Food vocabulary"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {matchedWorkbook && (
          <div className="text-xs rounded-lg px-3 py-2" style={{ background: "#e8edf8", color: "#003189" }}>
            ✓ Will link to the <strong>{matchedWorkbook.cefrLevel}</strong> workbook: {matchedWorkbook.title}
          </div>
        )}

        {/* Input mode toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes source</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => setInputMode("pdf")}
              className="flex-1 py-2 text-sm transition font-medium"
              style={{
                background: inputMode === "pdf" ? "#003189" : "white",
                color: inputMode === "pdf" ? "white" : "#374151",
              }}
            >
              PDF upload
            </button>
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className="flex-1 py-2 text-sm transition font-medium"
              style={{
                background: inputMode === "text" ? "#003189" : "white",
                color: inputMode === "text" ? "white" : "#374151",
              }}
            >
              Paste text
            </button>
          </div>
        </div>

        {inputMode === "pdf" ? (
          <div>
            <input
              name="file"
              type="file"
              accept=".pdf,.docx,.doc"
              required
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-medium"
              style={{ ["--file-selector-button-bg" as string]: "#e8edf8" }}
            />
            <p className="text-xs text-gray-400 mt-1">PDF, Word (.docx/.doc) · max 20MB</p>

            {pdfWarning && (
              <div className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: "#fff8e1", color: "#856404" }}>
                ⚠️ This file is very small — it may be a scanned image rather than a text PDF. If AI generation produces poor results, try switching to &ldquo;Paste text&rdquo; and copying your notes manually.
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paste your lesson notes</label>
            <textarea
              name="pastedText"
              required={inputMode === "text"}
              rows={10}
              placeholder="Paste your lesson notes here — vocabulary lists, grammar explanations, examples…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tip: more text = better exercises. Aim for at least a few paragraphs.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          style={{ background: loading ? "#666" : "#003189" }}
        >
          {loading ? "Uploading…" : "Upload & continue"}
        </button>
      </form>
    </div>
  );
}
