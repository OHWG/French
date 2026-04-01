import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuizRunner from "@/components/quiz/QuizRunner";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      items: { include: { exercise: true }, orderBy: { order: "asc" } },
      lesson: { select: { userId: true, title: true, cefrLevel: true, id: true } },
    },
  });

  if (!quiz || quiz.lesson.userId !== (session!.user!.id as string)) notFound();

  const questions = quiz.items.map((item) => ({
    id: item.exercise.id,
    type: item.exercise.type,
    question: item.exercise.question,
    content: JSON.parse(item.exercise.content),
  }));

  return (
    <QuizRunner
      quizId={quiz.id}
      quizTitle={quiz.title}
      lessonId={quiz.lesson.id}
      lessonTitle={quiz.lesson.title}
      cefrLevel={quiz.lesson.cefrLevel}
      questions={questions}
    />
  );
}
