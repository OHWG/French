import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromBuffer } from "@/lib/pdf";
import { extractTextFromDocx } from "@/lib/docx";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const cefrLevel = formData.get("cefrLevel") as string;
  const title = formData.get("title") as string;
  const inputMode = (formData.get("inputMode") as string) ?? "file";
  const pastedText = formData.get("pastedText") as string | null;

  if (!cefrLevel || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let rawText = "";

  if (inputMode === "text") {
    if (!pastedText || pastedText.trim().length < 50) {
      return NextResponse.json({ error: "Please paste at least 50 characters of text" }, { status: 400 });
    }
    rawText = pastedText.trim();
  } else {
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 4MB). Use the Paste text option for larger workbooks." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".docx") || name.endsWith(".doc")) {
        rawText = await extractTextFromDocx(buffer);
      } else {
        rawText = await extractTextFromBuffer(new Uint8Array(buffer));
      }
    } catch {
      rawText = "[Text extraction failed]";
    }
  }

  const workbook = await prisma.workbook.upsert({
    where: { cefrLevel },
    update: { title, rawText },
    create: { cefrLevel, title, rawText },
  });

  return NextResponse.json({ id: workbook.id }, { status: 201 });
}
