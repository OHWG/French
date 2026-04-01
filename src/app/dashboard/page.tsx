import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-red-100 text-red-800",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [lessons, attempts] = await Promise.all([
    prisma.lesson.findMany({
      where: { userId },
      include: { _count: { select: { exercises: true, quizzes: true, flashcardDecks: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { include: { lesson: { select: { title: true, cefrLevel: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalLessons = await prisma.lesson.count({ where: { userId } });
  const totalAttempts = await prisma.quizAttempt.count({ where: { userId } });
  const avgScore =
    attempts.length > 0
      ? Math.round((attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length))
      : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">
        Bonjour, {session?.user?.name ?? "there"}!
      </h1>
      <p className="text-gray-500 mb-8">Here&apos;s your study overview.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Lessons uploaded", value: totalLessons },
          { label: "Quizzes taken", value: totalAttempts },
          { label: "Avg quiz score", value: avgScore !== null ? `${avgScore}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-3xl font-bold text-blue-800">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Recent lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Recent lessons</h2>
            <Link href="/lessons" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {lessons.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              <p className="mb-3">No lessons yet.</p>
              <Link href="/lessons/new" className="text-blue-600 font-medium hover:underline">
                Upload your first lesson →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/lessons/${l.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition"
                >
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{l.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {l._count.exercises} exercises · {l._count.flashcardDecks} decks
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CEFR_COLORS[l.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}>
                    {l.cefrLevel}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent quiz attempts */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Recent quiz attempts</h2>
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              Take a quiz on any lesson to see your scores here.
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => {
                const pct = Math.round((a.score / a.total) * 100);
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-800">
                        {a.quiz.lesson.title}
                      </div>
                      <span
                        className={`text-sm font-bold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}
                      >
                        {a.score}/{a.total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
