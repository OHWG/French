import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-red-100 text-red-800",
};

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id as string;
  const { level } = await searchParams;

  const lessons = await prisma.lesson.findMany({
    where: { userId, ...(level ? { cefrLevel: level } : {}) },
    include: {
      _count: { select: { exercises: true, flashcardDecks: true, quizzes: true, vocabulary: true } },
    },
    orderBy: [{ cefrLevel: "asc" }, { weekNumber: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900">My Lessons</h1>
        <Link
          href="/lessons/new"
          className="bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Upload lesson
        </Link>
      </div>

      {/* Level filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/lessons"
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${!level ? "bg-blue-800 text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-blue-400"}`}
        >
          All
        </Link>
        {CEFR_LEVELS.map((l) => (
          <Link
            key={l}
            href={`/lessons?level=${l}`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${level === l ? "bg-blue-800 text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-blue-400"}`}
          >
            {l}
          </Link>
        ))}
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-400">
          <p className="text-lg mb-2">No lessons found.</p>
          <Link href="/lessons/new" className="text-blue-600 font-medium hover:underline">
            Upload your first lesson →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {lessons.map((l) => (
            <Link
              key={l.id}
              href={`/lessons/${l.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-gray-800 text-sm leading-snug pr-2">{l.title}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${CEFR_COLORS[l.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}>
                  {l.cefrLevel}
                </span>
              </div>
              {l.topic && <p className="text-xs text-gray-500 mb-3">{l.topic}</p>}
              {l.weekNumber && <p className="text-xs text-gray-400 mb-3">Week {l.weekNumber}</p>}
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{l._count.exercises} exercises</span>
                <span>{l._count.vocabulary} vocab</span>
                <span>{l._count.flashcardDecks} decks</span>
                <span>{l._count.quizzes} quizzes</span>
              </div>
              {l._count.exercises === 0 && (
                <p className="text-xs text-amber-600 mt-2">⚡ Generate activities</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
