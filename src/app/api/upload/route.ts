import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromBuffer } from "@/lib/pdf";

export const maxDuration = 60;

const PDF_QUALITY_THRESHOLD = 200;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const cefrLevel = formData.get("cefrLevel") as string;
  const weekNumber = formData.get("weekNumber") as string | null;
  const topic = formData.get("topic") as string | null;
  const workbookId = formData.get("workbookId") as string | null;
  const inputMode = (formData.get("inputMode") as string) ?? "pdf";
  const pastedText = formData.get("pastedText") as string | null;

  if (!title || !cefrLevel) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let rawText = "";

  if (inputMode === "text") {
    if (!pastedText || pastedText.trim().length < 50) {
      return NextResponse.json({ error: "Please paste at least 50 characters of notes" }, { status: 400 });
    }
    rawText = pastedText.trim();
  } else {
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      rawText = await extractTextFromBuffer(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `PDF text extraction failed: ${msg}. Please use the 'Paste text' option instead.` },
        { status: 422 }
      );
    }
  }

  const lesson = await prisma.lesson.create({
    data: {
      userId: session.user.id,
      title,
      cefrLevel,
      weekNumber: weekNumber ? parseInt(weekNumber) : null,
      topic: topic || null,
      workbookId: workbookId || null,
      rawText,
      generationStatus: "idle",
    },
  });

  return NextResponse.json({
    lessonId: lesson.id,
    textQualityWarning: rawText.replace(/\s/g, "").length < PDF_QUALITY_THRESHOLD,
  }, { status: 201 });
}
