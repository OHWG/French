import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-haiku-4-5-20251001"; // fast & cost-effective; swap for claude-sonnet-4-6 for richer output

export interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FillBlankQuestion {
  sentence: string; // contains ___ for the blank
  correctAnswer: string;
  hint?: string;
  explanation: string;
}

export interface VocabItem {
  french: string;
  english: string;
  partOfSpeech?: string;
  example?: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
  hint?: string;
}

export interface GeneratedContent {
  multipleChoice: MultipleChoiceQuestion[];
  fillBlank: FillBlankQuestion[];
  vocabulary: VocabItem[];
  flashcards: FlashcardItem[];
}

export async function generateLessonContent(
  lessonText: string,
  cefrLevel: string,
  topic: string | null
): Promise<GeneratedContent> {
  const topicLine = topic ? `Topic focus: ${topic}` : "";

  const prompt = `You are a French language tutor creating study materials for a ${cefrLevel} level student.
${topicLine}

Here is the lesson content to base the activities on:
<lesson>
${lessonText.slice(0, 12000)}
</lesson>

Generate study materials in this EXACT JSON format (no markdown, just JSON):
{
  "multipleChoice": [
    {
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "why this is correct"
    }
  ],
  "fillBlank": [
    {
      "sentence": "Je ___ au cinéma hier soir.",
      "correctAnswer": "suis allé",
      "hint": "passé composé of aller",
      "explanation": "Use passé composé with être for verbs of movement"
    }
  ],
  "vocabulary": [
    {
      "french": "le cinéma",
      "english": "cinema / movie theatre",
      "partOfSpeech": "noun (m)",
      "example": "Je vais au cinéma ce soir."
    }
  ],
  "flashcards": [
    {
      "front": "What is the passé composé of 'aller'?",
      "back": "je suis allé(e)",
      "hint": "Uses être as auxiliary"
    }
  ]
}

Rules:
- Generate exactly 8 multiple choice questions testing grammar and vocabulary from the text
- Generate exactly 8 fill-in-the-blank sentences using key grammar structures
- Extract exactly 15 vocabulary items from the lesson
- Generate exactly 15 flashcards (mix of vocab and grammar rules)
- Keep difficulty appropriate for ${cefrLevel} level
- All questions must be directly based on the provided lesson content
- Return ONLY valid JSON, no other text`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip any markdown code fences if present
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(jsonText) as GeneratedContent;
}

export async function generateMockExam(
  lessonsText: string,
  cefrLevel: string
): Promise<MultipleChoiceQuestion[]> {
  const prompt = `You are a French language examiner creating a mock exam for a ${cefrLevel} level student.

Here are the lesson materials to base the exam on:
<lessons>
${lessonsText.slice(0, 16000)}
</lessons>

Generate a 20-question mock exam as JSON array (no markdown):
[
  {
    "question": "question text",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "explanation of correct answer"
  }
]

Rules:
- 20 questions covering grammar, vocabulary, and comprehension
- Mix of difficulty appropriate for ${cefrLevel}
- Questions must span topics from across all provided lessons
- Return ONLY a valid JSON array, no other text`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(jsonText) as MultipleChoiceQuestion[];
}
