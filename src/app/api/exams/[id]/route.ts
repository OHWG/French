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
  const exam = await prisma.mockExam.findFirst({
    where: { id, userId: session.user.id },
    include: {
      lessons: { include: { lesson: { select: { title: true, cefrLevel: true } } } },
      attempts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(exam);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.mockExam.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
