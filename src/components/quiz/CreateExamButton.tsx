"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Lesson {
  id: string;
  title: string;
  cefrLevel: string;
  weekNumber: number | null;
  topic: string | null;
}

const CEFR_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#dcfce7", text: "#166534" },
  A2: { bg: "#ccfbf1", text: "#115e59" },
  B1: { bg: "#dbeafe", text: "#1e40af" },
  B2: { bg: "#e0e7ff", text: "#3730a3" },
  C1: { bg: "#f3e8ff", text: "#6b21a8" },
  C2: { bg: "#fee2e2", text: "#991b1b" },
};

export default function CreateExamButton({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [cefrLevel, setCefrLevel] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredLessons = cefrLevel ? lessons.filter((l) => l.cefrLevel === cefrLevel) : lessons;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim()) { setError("Please enter a title"); return; }
    if (selectedIds.size < 1) { setError("Select at least one lesson"); return; }
    if (!cefrLevel) { setError("Select a CEFR level"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, lessonIds: Array.from(selectedIds), cefrLevel }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create exam");
      setLoading(false);
      return;
    }

    const { examId } = await res.json();
    setOpen(false);
    router.push(`/exams/${examId}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
        style={{ background: "#EF3340" }}
      >
        + Create exam
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold" style={{ color: "#003189" }}>Create mock exam</h2>
              <p className="text-gray-500 text-sm mt-0.5">Select lessons to combine into a 20-question exam.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && (
                <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#ffeef0", color: "#c62828" }}>
                  {error}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. B1 Mid-term Revision"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEFR level</label>
                <select
                  value={cefrLevel}
                  onChange={(e) => { setCefrLevel(e.target.value); setSelectedIds(new Set()); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All levels</option>
                  {CEFR_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select lessons <span className="text-gray-400 font-normal">({selectedIds.size} selected)</span>
                </label>
                {filteredLessons.length === 0 ? (
                  <p className="text-sm text-gray-400">No lessons found for this level.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredLessons.map((l) => {
                      const col = CEFR_COLORS[l.cefrLevel] ?? { bg: "#f3f4f6", text: "#374151" };
                      const selected = selectedIds.has(l.id);
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => toggle(l.id)}
                          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition"
                          style={{
                            borderColor: selected ? "#003189" : "#e5e7eb",
                            background: selected ? "#e8edf8" : "white",
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition"
                            style={{ borderColor: selected ? "#003189" : "#d1d5db", background: selected ? "#003189" : "white" }}
                          >
                            {selected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{l.title}</div>
                            {l.topic && <div className="text-xs text-gray-400 truncate">{l.topic}</div>}
                          </div>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: col.bg, color: col.text }}
                          >
                            {l.cefrLevel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => { setOpen(false); setError(""); setSelectedIds(new Set()); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
                style={{ background: loading ? "#666" : "#003189" }}
              >
                {loading ? "Generating exam…" : "Generate exam"}
              </button>
            </div>

            {loading && (
              <p className="text-center text-xs text-gray-400 pb-3">
                Claude is writing 20 questions — usually 20–30 seconds…
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
