import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cefrLevel = searchParams.get("cefrLevel");
  const topic = searchParams.get("topic");

  const lessons = await prisma.lesson.findMany({
    where: {
      userId: session.user.id,
      ...(cefrLevel ? { cefrLevel } : {}),
      ...(topic ? { topic: { contains: topic } } : {}),
    },
    include: {
      _count: { select: { exercises: true, flashcardDecks: true, quizzes: true, vocabulary: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lessons);
}
