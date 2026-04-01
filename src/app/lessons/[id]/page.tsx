import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GenerateButton from "@/components/lessons/GenerateButton";

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-red-100 text-red-800",
};

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: { id, userId: session!.user!.id as string },
    include: {
      exercises: { orderBy: { createdAt: "asc" } },
      flashcardDecks: { include: { _count: { select: { cards: true } } } },
      quizzes: {
        include: { _count: { select: { items: true, attempts: true } } },
      },
      vocabulary: { take: 10, orderBy: { french: "asc" } },
      workbook: { select: { cefrLevel: true, title: true } },
    },
  });

  if (!lesson) notFound();

  const mcCount = lesson.exercises.filter((e) => e.type === "multiple_choice").length;
  const fbCount = lesson.exercises.filter((e) => e.type === "fill_blank").length;
  const hasContent = lesson.exercises.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/lessons" className="text-sm text-gray-400 hover:text-blue-600">← Lessons</Link>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">{lesson.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CEFR_COLORS[lesson.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}>
              {lesson.cefrLevel}
            </span>
            {lesson.weekNumber && <span className="text-xs text-gray-500">Week {lesson.weekNumber}</span>}
            {lesson.topic && <span className="text-xs text-gray-500">{lesson.topic}</span>}
            {lesson.workbook && (
              <span className="text-xs text-blue-600">📖 {lesson.workbook.title}</span>
            )}
          </div>
        </div>
        <GenerateButton lessonId={lesson.id} hasContent={hasContent} />
      </div>

      {!hasContent ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-8">
          <p className="text-amber-800 font-medium mb-1">No activities generated yet</p>
          <p className="text-amber-600 text-sm">Click &ldquo;Generate activities&rdquo; above to create exercises, flashcards and a quiz from your notes.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Exercises card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-2xl mb-2">✏️</div>
            <h3 className="font-semibold text-gray-800 mb-1">Exercises</h3>
            <p className="text-xs text-gray-500 mb-3">
              {mcCount} multiple choice · {fbCount} fill-in-the-blank
            </p>
            {lesson.quizzes[0] && (
              <Link
                href={`/quiz/${lesson.quizzes[0].id}`}
                className="block text-center bg-blue-800 text-white text-sm py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                Take practice quiz
              </Link>
            )}
          </div>

          {/* Flashcards */}
          {lesson.flashcardDecks.map((deck) => (
            <div key={deck.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl mb-2">🃏</div>
              <h3 className="font-semibold text-gray-800 mb-1">Flashcards</h3>
              <p className="text-xs text-gray-500 mb-3">{deck._count.cards} cards</p>
              <Link
                href={`/flashcards/${deck.id}`}
                className="block text-center bg-indigo-700 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-600 transition"
              >
                Study flashcards
              </Link>
            </div>
          ))}

          {/* Vocabulary */}
          {lesson.vocabulary.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-800 mb-1">Vocabulary</h3>
              <p className="text-xs text-gray-500 mb-3">{lesson.vocabulary.length}+ words extracted</p>
              <Link
                href={`/lessons/${lesson.id}/vocab`}
                className="block text-center bg-teal-700 text-white text-sm py-1.5 rounded-lg hover:bg-teal-600 transition"
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
          <h2 className="font-semibold text-gray-700 mb-3">Vocabulary preview</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                    <td className="px-4 py-2 font-medium text-blue-800">{v.french}</td>
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
