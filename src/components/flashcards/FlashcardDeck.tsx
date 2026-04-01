"use client";
import { useState, useCallback } from "react";
import Link from "next/link";

interface Card {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
}

export default function FlashcardDeck({
  deckTitle,
  lessonId,
  lessonTitle,
  cards,
}: {
  deckTitle: string;
  lessonId: string;
  lessonTitle: string;
  cards: Card[];
}) {
  const [deck, setDeck] = useState(cards);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const card = deck[current];

  const shuffle = useCallback(() => {
    setDeck((d) => [...d].sort(() => Math.random() - 0.5));
    setCurrent(0);
    setFlipped(false);
    setKnown(new Set());
    setFinished(false);
  }, []);

  function flip() {
    setFlipped((f) => !f);
  }

  function markKnown() {
    const newKnown = new Set(known);
    newKnown.add(card.id);
    setKnown(newKnown);
    advance(newKnown);
  }

  function markUnknown() {
    const newKnown = new Set(known);
    newKnown.delete(card.id);
    setKnown(newKnown);
    advance(newKnown);
  }

  function advance(k: Set<string>) {
    setFlipped(false);
    // Find next card that isn't "known"
    let next = current + 1;
    while (next < deck.length && k.has(deck[next].id)) next++;
    if (next >= deck.length) {
      // Check if all are known
      const remaining = deck.filter((c) => !k.has(c.id));
      if (remaining.length === 0) {
        setFinished(true);
      } else {
        // Loop back
        const firstUnknown = deck.findIndex((c) => !k.has(c.id));
        setCurrent(firstUnknown >= 0 ? firstUnknown : 0);
      }
    } else {
      setCurrent(next);
    }
  }

  const remaining = deck.filter((c) => !known.has(c.id)).length;

  if (finished) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">All cards mastered!</h2>
        <p className="text-gray-500 mb-8">You&apos;ve worked through all {deck.length} cards in this deck.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/lessons/${lessonId}`} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:border-blue-400">
            Back to lesson
          </Link>
          <button onClick={shuffle} className="bg-blue-800 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700">
            Shuffle &amp; restart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Link href={`/lessons/${lessonId}`} className="text-sm text-gray-400 hover:text-blue-600">
          ← {lessonTitle}
        </Link>
        <button onClick={shuffle} className="text-xs text-gray-400 hover:text-blue-600">
          Shuffle
        </button>
      </div>
      <h1 className="text-lg font-bold text-blue-900 mb-1">{deckTitle}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {remaining} remaining · {known.size} known · {deck.length} total
      </p>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${Math.round((known.size / deck.length) * 100)}%` }}
        />
      </div>

      {/* Card */}
      <div className="perspective mb-6">
        <div
          className={`flip-card relative w-full cursor-pointer ${flipped ? "flipped" : ""}`}
          style={{ height: "260px" }}
          onClick={flip}
        >
          {/* Front */}
          <div className="flip-front absolute inset-0 bg-white rounded-2xl border-2 border-blue-200 flex flex-col items-center justify-center px-8 shadow-sm">
            <p className="text-xs text-blue-400 uppercase tracking-widest mb-4">Front</p>
            <p className="text-xl font-semibold text-center text-gray-800">{card.front}</p>
            {card.hint && <p className="text-xs text-gray-400 mt-4 italic">💡 {card.hint}</p>}
            <p className="text-xs text-gray-400 mt-6">Tap to reveal</p>
          </div>
          {/* Back */}
          <div className="flip-back absolute inset-0 bg-blue-800 rounded-2xl flex flex-col items-center justify-center px-8 shadow-sm">
            <p className="text-xs text-blue-300 uppercase tracking-widest mb-4">Answer</p>
            <p className="text-xl font-semibold text-center text-white">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {flipped && (
        <div className="flex gap-3">
          <button
            onClick={markUnknown}
            className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-600 font-semibold hover:bg-red-50 transition"
          >
            Still learning
          </button>
          <button
            onClick={markKnown}
            className="flex-1 py-3 rounded-xl border-2 border-green-400 text-green-700 font-semibold hover:bg-green-50 transition"
          >
            Got it ✓
          </button>
        </div>
      )}
      {!flipped && (
        <button
          onClick={flip}
          className="w-full py-3 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-700 transition"
        >
          Reveal answer
        </button>
      )}

      {/* Navigation dots */}
      <div className="flex justify-center gap-1 mt-6 flex-wrap">
        {deck.map((c, i) => (
          <div
            key={c.id}
            className={`w-2 h-2 rounded-full transition ${
              known.has(c.id) ? "bg-green-500" : i === current ? "bg-blue-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
