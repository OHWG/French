import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lesson = await prisma.lesson.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exercises: { orderBy: { createdAt: "asc" } },
      flashcardDecks: { include: { cards: true } },
      quizzes: {
        include: {
          items: { include: { exercise: true }, orderBy: { order: "asc" } },
          _count: { select: { attempts: true } },
        },
      },
      vocabulary: { orderBy: { french: "asc" } },
      workbook: { select: { cefrLevel: true, title: true } },
    },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lesson);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.lesson.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
