import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMockExam } from "@/lib/ai";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exams = await prisma.mockExam.findMany({
    where: { userId: session.user.id },
    include: {
      lessons: { include: { lesson: { select: { title: true, cefrLevel: true } } } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 503 });
  }

  const { title, lessonIds, cefrLevel } = await req.json() as {
    title: string;
    lessonIds: string[];
    cefrLevel: string;
  };

  if (!title || !lessonIds || lessonIds.length < 1) {
    return NextResponse.json({ error: "Provide a title and at least one lesson" }, { status: 400 });
  }

  // Verify all lessons belong to this user
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, userId: session.user.id },
    select: { id: true, title: true, rawText: true, cefrLevel: true, topic: true },
  });

  if (lessons.length !== lessonIds.length) {
    return NextResponse.json({ error: "One or more lessons not found" }, { status: 404 });
  }

  // Build combined context — first 3000 chars per lesson
  const combinedText = lessons
    .map((l) => `=== ${l.title}${l.topic ? ` (${l.topic})` : ""} ===\n${l.rawText.slice(0, 3000)}`)
    .join("\n\n");

  const questions = await generateMockExam(combinedText, cefrLevel);

  const exam = await prisma.mockExam.create({
    data: {
      userId: session.user.id,
      title,
      cefrLevel,
      questions: JSON.stringify(questions),
      lessons: {
        create: lessons.map((l) => ({ lessonId: l.id })),
      },
    },
  });

  return NextResponse.json({ examId: exam.id }, { status: 201 });
}
