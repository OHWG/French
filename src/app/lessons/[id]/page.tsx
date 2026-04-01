import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GenerateButton from "@/components/lessons/GenerateButton";

const CEFR_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#dcfce7", text: "#166534" },
  A2: { bg: "#ccfbf1", text: "#115e59" },
  B1: { bg: "#dbeafe", text: "#1e40af" },
  B2: { bg: "#e0e7ff", text: "#3730a3" },
  C1: { bg: "#f3e8ff", text: "#6b21a8" },
  C2: { bg: "#fee2e2", text: "#991b1b" },
};

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: { id, userId: session!.user!.id as string },
    include: {
      exercises: { orderBy: { createdAt: "asc" } },
      flashcardDecks: { include: { _count: { select: { cards: true } } } },
      quizzes: { include: { _count: { select: { items: true, attempts: true } } } },
      vocabulary: { take: 10, orderBy: { french: "asc" } },
      workbook: { select: { cefrLevel: true, title: true } },
    },
  });

  if (!lesson) notFound();

  const mcCount = lesson.exercises.filter((e) => e.type === "multiple_choice").length;
  const fbCount = lesson.exercises.filter((e) => e.type === "fill_blank").length;
  const hasContent = lesson.exercises.length > 0;
  const col = CEFR_COLORS[lesson.cefrLevel] ?? { bg: "#f3f4f6", text: "#374151" };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <Link href="/lessons" className="text-sm text-gray-400 hover:text-blue-600 mb-1 block">← Lessons</Link>
          <h1 className="text-2xl font-bold truncate" style={{ color: "#003189" }}>{lesson.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: col.bg, color: col.text }}
            >
              {lesson.cefrLevel}
            </span>
            {lesson.weekNumber && <span className="text-xs text-gray-500">Week {lesson.weekNumber}</span>}
            {lesson.topic && <span className="text-xs text-gray-500">{lesson.topic}</span>}
            {lesson.workbook && (
              <span className="text-xs" style={{ color: "#003189" }}>📖 {lesson.workbook.title}</span>
            )}
          </div>
        </div>
        <GenerateButton
          lessonId={lesson.id}
          initialStatus={lesson.generationStatus as "idle" | "generating" | "done" | "error"}
          initialError={lesson.generationError}
        />
      </div>

      {/* Status banners */}
      {lesson.generationStatus === "generating" && (
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "#e8edf8", color: "#003189" }}>
          ⏳ Generating your activities — this page will refresh automatically when ready.
        </div>
      )}

      {lesson.generationStatus === "error" && !hasContent && (
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "#ffeef0", color: "#c62828" }}>
          <strong>Generation failed.</strong> {lesson.generationError}
          <br /><span className="text-xs mt-1 block">Click &ldquo;Retry generation&rdquo; above to try again.</span>
        </div>
      )}

      {lesson.generationStatus === "idle" && !hasContent && (
        <div className="rounded-xl p-5 mb-6 text-center" style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
          <p className="font-medium text-amber-900 mb-1">No activities generated yet</p>
          <p className="text-amber-700 text-sm">Click ⚡ Generate activities above to create exercises, flashcards and a quiz from your notes.</p>
        </div>
      )}

      {hasContent && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Practice quiz */}
          {lesson.quizzes[0] && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="text-2xl mb-2">✏️</div>
              <h3 className="font-semibold text-gray-800 mb-1">Practice Quiz</h3>
              <p className="text-xs text-gray-500 mb-3">
                {mcCount} multiple choice · {fbCount} fill-in-the-blank
              </p>
              <Link
                href={`/quiz/${lesson.quizzes[0].id}`}
                className="block text-center text-white text-sm py-1.5 rounded-lg transition"
                style={{ background: "#003189" }}
              >
                Take quiz
              </Link>
              {lesson.quizzes[0]._count.attempts > 0 && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  {lesson.quizzes[0]._count.attempts} attempt{lesson.quizzes[0]._count.attempts !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Flashcards */}
          {lesson.flashcardDecks.map((deck) => (
            <div key={deck.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="text-2xl mb-2">🃏</div>
              <h3 className="font-semibold text-gray-800 mb-1">Flashcards</h3>
              <p className="text-xs text-gray-500 mb-3">{deck._count.cards} cards</p>
              <Link
                href={`/flashcards/${deck.id}`}
                className="block text-center text-white text-sm py-1.5 rounded-lg transition"
                style={{ background: "#4f46e5" }}
              >
                Study flashcards
              </Link>
            </div>
          ))}

          {/* Vocabulary */}
          {lesson.vocabulary.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-800 mb-1">Vocabulary</h3>
              <p className="text-xs text-gray-500 mb-3">{lesson.vocabulary.length}+ words extracted</p>
              <Link
                href={`/lessons/${lesson.id}/vocab`}
                className="block text-center text-white text-sm py-1.5 rounded-lg transition"
                style={{ background: "#0f766e" }}
              >
                View vocab list
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Vocab preview */}
      {lesson.vocabulary.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Vocabulary preview</h2>
            <Link href={`/lessons/${lesson.id}/vocab`} className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">French</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">English</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium hidden sm:table-cell">Type</th>
                </tr>
              </thead>
              <tbody>
                {lesson.vocabulary.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 font-medium" style={{ color: "#003189" }}>{v.french}</td>
                    <td className="px-4 py-2 text-gray-600">{v.english}</td>
                    <td className="px-4 py-2 text-gray-400 hidden sm:table-cell text-xs">{v.partOfSpeech}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
