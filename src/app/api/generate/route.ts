import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLessonContent } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env." },
      { status: 503 }
    );
  }

  const { lessonId } = await req.json();

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, userId: session.user.id },
    include: { workbook: true },
  });

  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  if (lesson.rawText.replace(/\s/g, "").length < 100) {
    return NextResponse.json(
      { error: "Not enough text to generate activities. Try re-uploading with more content, or use the 'Paste text' option." },
      { status: 422 }
    );
  }

  // Mark as generating
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { generationStatus: "generating", generationError: null },
  });

  try {
    const fullText = lesson.workbook
      ? `WORKBOOK CONTEXT:\n${lesson.workbook.rawText.slice(0, 4000)}\n\nLESSON NOTES:\n${lesson.rawText}`
      : lesson.rawText;

    const generated = await generateLessonContent(fullText, lesson.cefrLevel, lesson.topic);

    // Clear previous generated content
    await prisma.exercise.deleteMany({ where: { lessonId } });
    await prisma.flashcardDeck.deleteMany({ where: { lessonId } });
    await prisma.vocabItem.deleteMany({ where: { lessonId } });

    // Save vocabulary
    if (generated.vocabulary.length > 0) {
      await prisma.vocabItem.createMany({
        data: generated.vocabulary.map((v) => ({
          lessonId,
          french: v.french,
          english: v.english,
          partOfSpeech: v.partOfSpeech ?? null,
          example: v.example ?? null,
        })),
      });
    }

    // Save multiple choice exercises
    for (const q of generated.multipleChoice) {
      await prisma.exercise.create({
        data: {
          lessonId,
          type: "multiple_choice",
          question: q.question,
          content: JSON.stringify({
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          }),
        },
      });
    }

    // Save fill-in-the-blank exercises
    for (const q of generated.fillBlank) {
      await prisma.exercise.create({
        data: {
          lessonId,
          type: "fill_blank",
          question: q.sentence,
          content: JSON.stringify({
            correctAnswer: q.correctAnswer,
            hint: q.hint ?? null,
            explanation: q.explanation,
          }),
        },
      });
    }

    // Save flashcard deck
    if (generated.flashcards.length > 0) {
      const deck = await prisma.flashcardDeck.create({
        data: { lessonId, title: `${lesson.title} — Flashcards` },
      });
      await prisma.flashcard.createMany({
        data: generated.flashcards.map((f) => ({
          deckId: deck.id,
          front: f.front,
          back: f.back,
          hint: f.hint ?? null,
        })),
      });
    }

    // Auto-create / replace the practice quiz
    const exercises = await prisma.exercise.findMany({ where: { lessonId } });
    if (exercises.length > 0) {
      const existing = await prisma.quiz.findFirst({ where: { lessonId, type: "practice" } });
      if (existing) {
        await prisma.quizItem.deleteMany({ where: { quizId: existing.id } });
        await prisma.quiz.delete({ where: { id: existing.id } });
      }
      const quiz = await prisma.quiz.create({
        data: { lessonId, title: `${lesson.title} — Practice Quiz`, type: "practice" },
      });
      await prisma.quizItem.createMany({
        data: exercises.map((e, i) => ({ quizId: quiz.id, exerciseId: e.id, order: i })),
      });
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { generationStatus: "done" },
    });

    return NextResponse.json({
      exercises: exercises.length,
      vocabulary: generated.vocabulary.length,
      flashcards: generated.flashcards.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { generationStatus: "error", generationError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
