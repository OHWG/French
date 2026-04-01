import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface MCQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { answers } = await req.json() as { answers: Record<string, number> };

  const exam = await prisma.mockExam.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions: MCQuestion[] = JSON.parse(exam.questions);
  let score = 0;

  const results = questions.map((q, i) => {
    const correct = answers[String(i)] === q.correctIndex;
    if (correct) score++;
    return {
      index: i,
      correct,
      correctIndex: q.correctIndex,
      correctAnswer: q.options[q.correctIndex],
      explanation: q.explanation,
    };
  });

  const attempt = await prisma.mockExamAttempt.create({
    data: {
      examId: id,
      userId: session.user.id,
      score,
      total: questions.length,
      answers: JSON.stringify(answers),
      results: JSON.stringify(results),
    },
  });

  return NextResponse.json({ attemptId: attempt.id, score, total: questions.length, results });
}
