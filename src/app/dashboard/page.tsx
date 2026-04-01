import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const CEFR_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#dcfce7", text: "#166534" },
  A2: { bg: "#ccfbf1", text: "#115e59" },
  B1: { bg: "#dbeafe", text: "#1e40af" },
  B2: { bg: "#e0e7ff", text: "#3730a3" },
  C1: { bg: "#f3e8ff", text: "#6b21a8" },
  C2: { bg: "#fee2e2", text: "#991b1b" },
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [lessons, attempts, totalLessons, totalAttempts] = await Promise.all([
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
    prisma.lesson.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId } }),
  ]);

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length)
      : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#003189" }}>
        Bonjour, {session?.user?.name ?? "there"}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Here&apos;s your study overview.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Lessons uploaded", value: totalLessons },
          { label: "Quizzes taken", value: totalAttempts },
          { label: "Avg quiz score", value: avgScore !== null ? `${avgScore}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-3xl font-bold mb-1" style={{ color: "#003189" }}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <Link
          href="/lessons/new"
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
          style={{ background: "#003189" }}
        >
          + Upload lesson
        </Link>
        <Link
          href="/exams"
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
          style={{ background: "#EF3340" }}
        >
          Create mock exam
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Recent lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Recent lessons</h2>
            <Link href="/lessons" className="text-sm hover:underline" style={{ color: "#003189" }}>View all</Link>
          </div>
          {lessons.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              <p className="mb-3">No lessons yet.</p>
              <Link href="/lessons/new" className="font-medium hover:underline" style={{ color: "#003189" }}>
                Upload your first lesson →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((l) => {
                const col = CEFR_COLORS[l.cefrLevel] ?? { bg: "#f3f4f6", text: "#374151" };
                return (
                  <Link
                    key={l.id}
                    href={`/lessons/${l.id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition shadow-sm"
                  >
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{l.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {l._count.exercises} exercises · {l._count.flashcardDecks} decks
                        {l.generationStatus === "generating" && (
                          <span className="ml-1" style={{ color: "#003189" }}>⏳ generating</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.text }}>
                      {l.cefrLevel}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent quiz attempts */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Recent quiz scores</h2>
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              Take a quiz on any lesson to see your scores here.
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => {
                const pct = Math.round((a.score / a.total) * 100);
                const barColour = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-sm font-medium text-gray-800 truncate pr-2">
                        {a.quiz.lesson.title}
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: barColour }}>
                        {a.score}/{a.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColour }} />
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
