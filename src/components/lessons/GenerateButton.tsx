"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "generating" | "done" | "error";

interface StatusData {
  generationStatus: Status;
  generationError?: string | null;
  _count?: { exercises: number; flashcardDecks: number; vocabulary: number; quizzes: number };
}

export default function GenerateButton({
  lessonId,
  initialStatus,
  initialError,
}: {
  lessonId: string;
  initialStatus: Status;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState(initialError ?? "");
  const [polling, setPolling] = useState(initialStatus === "generating");

  // Poll every 3 seconds while generating
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/status`);
        const data: StatusData = await res.json();
        setStatus(data.generationStatus);
        if (data.generationStatus === "error") {
          setError(data.generationError ?? "Generation failed");
          setPolling(false);
        } else if (data.generationStatus === "done") {
          setPolling(false);
          router.refresh();
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, lessonId, router]);

  const generate = useCallback(async () => {
    setStatus("generating");
    setError("");
    setPolling(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });

    if (!res.ok) {
      const d = await res.json();
      setStatus("error");
      setError(d.error ?? "Generation failed");
      setPolling(false);
    }
    // On success the poll loop will detect "done" and refresh
  }, [lessonId]);

  return (
    <div className="flex flex-col items-end gap-2">
      {status === "generating" ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#003189" }}>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Claude is generating your activities…</span>
        </div>
      ) : (
        <button
          onClick={generate}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap shadow-sm"
          style={{ background: status === "error" ? "#EF3340" : "#EF3340" }}
        >
          {status === "error" ? "⟳ Retry generation" : status === "done" ? "⟳ Re-generate" : "⚡ Generate activities"}
        </button>
      )}

      {status === "generating" && (
        <p className="text-xs text-gray-400">Usually takes 20–40 seconds</p>
      )}

      {status === "error" && error && (
        <p className="text-xs max-w-xs text-right" style={{ color: "#c62828" }}>
          {error}
        </p>
      )}
    </div>
  );
}
