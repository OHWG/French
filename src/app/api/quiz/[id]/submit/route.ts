import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { answers } = await req.json() as { answers: Record<string, string | number> };

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      items: { include: { exercise: true }, orderBy: { order: "asc" } },
      lesson: { select: { userId: true } },
    },
  });

  if (!quiz || quiz.lesson.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let score = 0;
  const results: { exerciseId: string; correct: boolean; correctAnswer: string; explanation: string }[] = [];

  for (const item of quiz.items) {
    const exercise = item.exercise;
    const content = JSON.parse(exercise.content);
    const userAnswer = answers[exercise.id];
    let correct = false;
    let correctAnswer = "";
    const explanation: string = content.explanation ?? "";

    if (exercise.type === "multiple_choice") {
      correct = Number(userAnswer) === content.correctIndex;
      correctAnswer = content.options[content.correctIndex];
    } else if (exercise.type === "fill_blank") {
      correct =
        typeof userAnswer === "string" &&
        userAnswer.trim().toLowerCase() === content.correctAnswer.trim().toLowerCase();
      correctAnswer = content.correctAnswer;
    }

    if (correct) score++;
    results.push({ exerciseId: exercise.id, correct, correctAnswer, explanation });
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: id,
      userId: session.user.id,
      score,
      total: quiz.items.length,
      answers: JSON.stringify(answers),
    },
  });

  return NextResponse.json({ attemptId: attempt.id, score, total: quiz.items.length, results });
}
