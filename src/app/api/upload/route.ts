import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromPDF, getUploadPath, sanitizeFilename } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const cefrLevel = formData.get("cefrLevel") as string;
  const weekNumber = formData.get("weekNumber") as string | null;
  const topic = formData.get("topic") as string | null;
  const workbookId = formData.get("workbookId") as string | null;

  if (!file || !title || !cefrLevel) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
  }

  const filename = sanitizeFilename(file.name);
  const filePath = getUploadPath(filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  let rawText = "";
  try {
    rawText = await extractTextFromPDF(filePath);
  } catch {
    rawText = "[PDF text extraction failed — please check the file]";
  }

  const lesson = await prisma.lesson.create({
    data: {
      userId: session.user.id,
      title,
      cefrLevel,
      weekNumber: weekNumber ? parseInt(weekNumber) : null,
      topic: topic || null,
      workbookId: workbookId || null,
      filePath: `/uploads/${filename}`,
      rawText,
    },
  });

  return NextResponse.json({ lessonId: lesson.id }, { status: 201 });
}
