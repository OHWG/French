import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MockExamRunner from "@/components/quiz/MockExamRunner";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const exam = await prisma.mockExam.findFirst({
    where: { id, userId: session!.user!.id as string },
    include: {
      lessons: { include: { lesson: { select: { title: true } } } },
    },
  });

  if (!exam) notFound();

  const questions = JSON.parse(exam.questions) as {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];

  return (
    <MockExamRunner
      examId={exam.id}
      examTitle={exam.title}
      cefrLevel={exam.cefrLevel}
      questions={questions}
    />
  );
}
