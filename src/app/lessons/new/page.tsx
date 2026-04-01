"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Workbook { id: string; cefrLevel: string; title: string }

export default function NewLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("");

  useEffect(() => {
    fetch("/api/workbooks")
      .then((r) => r.json())
      .then(setWorkbooks)
      .catch(() => {});
  }, []);

  const matchedWorkbook = workbooks.find((w) => w.cefrLevel === selectedLevel);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    if (matchedWorkbook) fd.set("workbookId", matchedWorkbook.id);

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
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Upload lesson notes</h1>
      <p className="text-gray-500 text-sm mb-8">
        Upload a PDF of your lesson notes. AI will then generate exercises and flashcards for you.
      </p>
      {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic <span className="text-gray-400">(optional)</span></label>
          <input
            name="topic"
            placeholder="e.g. Irregular verbs, Numbers, Food vocabulary"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {matchedWorkbook && (
          <div className="bg-blue-50 text-blue-700 text-xs rounded-lg px-3 py-2">
            ✓ Will be linked to the {matchedWorkbook.cefrLevel} workbook: <strong>{matchedWorkbook.title}</strong>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lesson PDF</label>
          <input
            name="file"
            type="file"
            accept=".pdf"
            required
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-400 mt-1">PDF only, max 20MB</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-800 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload & continue"}
        </button>
      </form>
    </div>
  );
}
