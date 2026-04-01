import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateExamButton from "@/components/quiz/CreateExamButton";

const CEFR_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#dcfce7", text: "#166534" },
  A2: { bg: "#ccfbf1", text: "#115e59" },
  B1: { bg: "#dbeafe", text: "#1e40af" },
  B2: { bg: "#e0e7ff", text: "#3730a3" },
  C1: { bg: "#f3e8ff", text: "#6b21a8" },
  C2: { bg: "#fee2e2", text: "#991b1b" },
};

export default async function ExamsPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [exams, lessons] = await Promise.all([
    prisma.mockExam.findMany({
      where: { userId },
      include: {
        lessons: { include: { lesson: { select: { title: true, cefrLevel: true } } } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lesson.findMany({
      where: { userId },
      select: { id: true, title: true, cefrLevel: true, weekNumber: true, topic: true },
      orderBy: [{ cefrLevel: "asc" }, { weekNumber: "asc" }],
    }),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#003189" }}>Mock Exams</h1>
          <p className="text-gray-500 text-sm mt-1">
            Combine lessons from your library into a timed mock exam.
          </p>
        </div>
        <CreateExamButton lessons={lessons} />
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-400">
          <p className="text-lg mb-2">No mock exams yet.</p>
          <p className="text-sm">Click &ldquo;Create exam&rdquo; and select 2–5 lessons to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const col = CEFR_COLORS[exam.cefrLevel] ?? { bg: "#f3f4f6", text: "#374151" };
            const questions = JSON.parse(exam.questions) as unknown[];
            return (
              <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-gray-800 pr-2">{exam.title}</h2>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: col.bg, color: col.text }}
                  >
                    {exam.cefrLevel}
                  </span>
                </div>

                <div className="text-xs text-gray-400 mb-1">
                  {questions.length} questions · {exam._count.attempts} attempt{exam._count.attempts !== 1 ? "s" : ""}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {exam.lessons.map(({ lesson }) => (
                    <span
                      key={lesson.title}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#e8edf8", color: "#003189" }}
                    >
                      {lesson.title}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/exams/${exam.id}`}
                  className="block text-center text-white text-sm py-2 rounded-lg transition font-medium"
                  style={{ background: "#003189" }}
                >
                  Take exam
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
