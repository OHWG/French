import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromBuffer } from "@/lib/pdf";

export async function GET() {
  const workbooks = await prisma.workbook.findMany({ orderBy: { cefrLevel: "asc" } });
  return NextResponse.json(workbooks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const cefrLevel = formData.get("cefrLevel") as string;
  const title = formData.get("title") as string;

  if (!file || !cefrLevel || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText = "";
  try {
    rawText = await extractTextFromBuffer(buffer);
  } catch {
    rawText = "[PDF text extraction failed]";
  }

  const workbook = await prisma.workbook.upsert({
    where: { cefrLevel },
    update: { title, rawText },
    create: { cefrLevel, title, rawText },
  });

  return NextResponse.json({ id: workbook.id }, { status: 201 });
}
