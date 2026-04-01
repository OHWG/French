import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FlashcardDeck from "@/components/flashcards/FlashcardDeck";

export default async function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const deck = await prisma.flashcardDeck.findUnique({
    where: { id },
    include: {
      cards: true,
      lesson: { select: { userId: true, title: true, id: true } },
    },
  });

  if (!deck || deck.lesson.userId !== (session!.user!.id as string)) notFound();

  return (
    <FlashcardDeck
      deckTitle={deck.title}
      lessonId={deck.lesson.id}
      lessonTitle={deck.lesson.title}
      cards={deck.cards.map((c) => ({ id: c.id, front: c.front, back: c.back, hint: c.hint }))}
    />
  );
}
