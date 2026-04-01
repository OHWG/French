"use client";
import { useState } from "react";
import Link from "next/link";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Result {
  index: number;
  correct: boolean;
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
}

export default function MockExamRunner({
  examId,
  examTitle,
  cefrLevel,
  questions,
}: {
  examId: string;
  examTitle: string;
  cefrLevel: string;
  questions: Question[];
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const q = questions[current];
  const answered = answers[String(current)] !== undefined;
  const allAnswered = questions.every((_, i) => answers[String(i)] !== undefined);
  const progress = Math.round(((current + 1) / questions.length) * 100);

  function select(optIndex: number) {
    setAnswers((prev) => ({ ...prev, [String(current)]: optIndex }));
  }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/exams/${examId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setResults(data.results);
    setScore(data.score);
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    const grade =
      pct >= 90 ? { label: "Excellent", emoji: "🏆", colour: "#16a34a" } :
      pct >= 75 ? { label: "Good", emoji: "🎉", colour: "#2563eb" } :
      pct >= 60 ? { label: "Pass", emoji: "👍", colour: "#d97706" } :
                  { label: "Needs work", emoji: "📚", colour: "#dc2626" };

    return (
      <div className="max-w-2xl mx-auto">
        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center mb-8">
          <div className="text-5xl mb-3">{grade.emoji}</div>
          <h2 className="text-3xl font-bold mb-1" style={{ color: grade.colour }}>{pct}%</h2>
          <p className="text-lg font-semibold text-gray-700 mb-1">{grade.label}</p>
          <p className="text-gray-500 text-sm mb-1">{score} / {questions.length} correct</p>
          <p className="text-xs text-gray-400">{examTitle} · {cefrLevel}</p>

          <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden mx-auto max-w-xs">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: grade.colour }}
            />
          </div>

          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Link
              href="/exams"
              className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Back to exams
            </Link>
            <button
              onClick={() => { setSubmitted(false); setCurrent(0); setAnswers({}); }}
              className="text-white px-5 py-2 rounded-lg text-sm font-medium transition"
              style={{ background: "#003189" }}
            >
              Retake exam
            </button>
          </div>
        </div>

        {/* Question review */}
        <h3 className="font-semibold text-gray-700 mb-3">Review all answers</h3>
        <div className="space-y-3">
          {questions.map((question, i) => {
            const result = results[i];
            const userChoice = answers[String(i)];
            return (
              <div
                key={i}
                className="bg-white rounded-xl border p-4 shadow-sm"
                style={{ borderColor: result?.correct ? "#bbf7d0" : "#fecaca" }}
              >
                <div className="flex gap-2 items-start mb-2">
                  <span className="text-base mt-0.5">{result?.correct ? "✅" : "❌"}</span>
                  <p className="text-sm font-medium text-gray-800">
                    Q{i + 1}. {question.question}
                  </p>
                </div>
                <div className="ml-6 space-y-1">
                  {question.options.map((opt, oi) => {
                    const isUser = userChoice === oi;
                    const isCorrect = oi === question.correctIndex;
                    return (
                      <div
                        key={oi}
                        className="text-xs px-2 py-1 rounded flex items-center gap-2"
                        style={{
                          background: isCorrect ? "#dcfce7" : isUser && !isCorrect ? "#fee2e2" : "transparent",
                          color: isCorrect ? "#166534" : isUser && !isCorrect ? "#991b1b" : "#6b7280",
                          fontWeight: isCorrect || isUser ? 600 : 400,
                        }}
                      >
                        <span>{["A", "B", "C", "D"][oi]}.</span> {opt}
                        {isCorrect && <span className="ml-auto">✓</span>}
                        {isUser && !isCorrect && <span className="ml-auto">✗ your answer</span>}
                      </div>
                    );
                  })}
                  {result?.explanation && (
                    <p className="text-xs text-gray-400 italic mt-1 pt-1 border-t border-gray-100">
                      {result.explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium" style={{ color: "#003189" }}>{examTitle}</p>
          <p className="text-sm text-gray-400">{current + 1} / {questions.length}</p>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: "#003189" }}
          />
        </div>
        {/* Answered dots */}
        <div className="flex flex-wrap gap-1 mt-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-5 h-5 rounded text-xs transition font-medium"
              style={{
                background: i === current ? "#003189" : answers[String(i)] !== undefined ? "#bfdbfe" : "#e5e7eb",
                color: i === current ? "white" : "#374151",
              }}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#003189" }}>
          Question {current + 1}
        </p>
        <p className="text-gray-800 font-medium text-base mb-6 leading-relaxed">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              className="w-full text-left px-4 py-3 rounded-xl border text-sm transition"
              style={{
                borderColor: answers[String(current)] === i ? "#003189" : "#e5e7eb",
                background: answers[String(current)] === i ? "#e8edf8" : "white",
                color: answers[String(current)] === i ? "#003189" : "#374151",
                fontWeight: answers[String(current)] === i ? 600 : 400,
              }}
            >
              <span className="font-semibold mr-2">{["A", "B", "C", "D"][i]}.</span> {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-30"
        >
          ← Previous
        </button>

        <div className="text-xs text-gray-400">
          {Object.keys(answers).length} / {questions.length} answered
        </div>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition"
            style={{ background: answered ? "#003189" : "#9ca3af" }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading || !allAnswered}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-50"
            style={{ background: allAnswered ? "#16a34a" : "#9ca3af" }}
            title={!allAnswered ? "Answer all questions first" : ""}
          >
            {loading ? "Submitting…" : "Submit exam"}
          </button>
        )}
      </div>

      {!allAnswered && current === questions.length - 1 && (
        <p className="text-xs text-center text-gray-400 mt-2">
          {questions.length - Object.keys(answers).length} question{questions.length - Object.keys(answers).length !== 1 ? "s" : ""} still unanswered — use the dots above to navigate back.
        </p>
      )}
    </div>
  );
}
