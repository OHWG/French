"use client";
import { useState } from "react";
import Link from "next/link";

interface Question {
  id: string;
  type: string;
  question: string;
  content: {
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
    hint?: string;
    explanation?: string;
  };
}

interface Result {
  exerciseId: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

export default function QuizRunner({
  quizId,
  quizTitle,
  lessonId,
  lessonTitle,
  cefrLevel,
  questions,
}: {
  quizId: string;
  quizTitle: string;
  lessonId: string;
  lessonTitle: string;
  cefrLevel: string;
  questions: Question[];
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const q = questions[current];
  const progress = Math.round(((current) / questions.length) * 100);

  function setAnswer(val: string | number) {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
    setShowHint(false);
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setShowHint(false);
    }
  }

  function prev() {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setShowHint(false);
    }
  }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setResults(data.results);
    setScore(data.score);
    setTotal(data.total);
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
          <div className="text-5xl mb-3">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📚"}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {score} / {total}
          </h2>
          <p className={`text-lg font-medium mb-2 ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
            {pct}%
          </p>
          <p className="text-gray-500 text-sm">
            {pct >= 80 ? "Excellent work! Très bien!" : pct >= 50 ? "Good effort — keep practising!" : "Don't give up — review the lesson and try again."}
          </p>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Link href={`/lessons/${lessonId}`} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:border-blue-400 transition">
              Back to lesson
            </Link>
            <button onClick={() => { setSubmitted(false); setCurrent(0); setAnswers({}); }} className="bg-blue-800 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              Retry quiz
            </button>
          </div>
        </div>

        {/* Review */}
        <h3 className="font-semibold text-gray-700 mb-3">Review answers</h3>
        <div className="space-y-3">
          {questions.map((question, i) => {
            const result = results.find((r) => r.exerciseId === question.id);
            return (
              <div key={question.id} className={`bg-white rounded-xl border p-4 ${result?.correct ? "border-green-200" : "border-red-200"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">{result?.correct ? "✅" : "❌"}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-1">Q{i + 1}. {question.question}</p>
                    <p className="text-xs text-gray-500">Your answer: <strong>{String(answers[question.id] ?? "—")}</strong></p>
                    {!result?.correct && (
                      <p className="text-xs text-green-700 mt-0.5">Correct: <strong>{result?.correctAnswer}</strong></p>
                    )}
                    {result?.explanation && (
                      <p className="text-xs text-gray-400 mt-1 italic">{result.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-gray-500">{quizTitle}</p>
          <p className="text-sm text-gray-500">
            {current + 1} / {questions.length}
          </p>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <p className="text-xs font-medium text-blue-600 mb-3 uppercase tracking-wide">
          {q.type === "multiple_choice" ? "Multiple choice" : "Fill in the blank"}
        </p>
        <p className="text-gray-800 font-medium text-lg mb-6 leading-relaxed">{q.question}</p>

        {q.type === "multiple_choice" && q.content.options && (
          <div className="space-y-2">
            {q.content.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswer(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                  answers[q.id] === i
                    ? "border-blue-600 bg-blue-50 text-blue-800 font-medium"
                    : "border-gray-200 hover:border-blue-300 text-gray-700"
                }`}
              >
                <span className="font-medium mr-2">{["A", "B", "C", "D"][i]}.</span> {opt}
              </button>
            ))}
          </div>
        )}

        {q.type === "fill_blank" && (
          <div>
            <input
              type="text"
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {q.content.hint && (
              <div className="mt-2">
                {showHint ? (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">💡 {q.content.hint}</p>
                ) : (
                  <button onClick={() => setShowHint(true)} className="text-xs text-gray-400 hover:text-blue-600">
                    Show hint
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prev}
          disabled={current === 0}
          className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 transition disabled:opacity-30"
        >
          ← Previous
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={next}
            className="px-5 py-2 rounded-lg bg-blue-800 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
