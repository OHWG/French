import Anthropic from "@anthropic-ai/sdk";

const PDF_TEXT_THRESHOLD = 200;

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  // First try pdf-parse — fast and free for text-based PDFs
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    const text = data.text as string;
    if (text.replace(/\s/g, "").length >= PDF_TEXT_THRESHOLD) {
      return text;
    }
  } catch {
    // fall through to Claude
  }

  // Fall back to Claude's document understanding for scanned / image PDFs
  if (!process.env.ANTHROPIC_API_KEY) {
    return "";
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64 = buffer.toString("base64");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          } as { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } },
          {
            type: "text",
            text: "Extract and transcribe ALL text from this PDF. Include vocabulary lists, grammar explanations, dialogues, exercises, and any other text. Preserve structure. Output only the extracted text, no commentary.",
          },
        ],
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}
