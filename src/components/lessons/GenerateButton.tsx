"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateButton({
  lessonId,
  hasContent,
}: {
  lessonId: string;
  hasContent: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Generation failed");
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={generate}
        disabled={loading}
        className="bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-400 transition disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? "Generating…" : hasContent ? "Re-generate" : "⚡ Generate activities"}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {loading && (
        <p className="text-xs text-gray-500">This takes ~20 seconds…</p>
      )}
    </div>
  );
}
