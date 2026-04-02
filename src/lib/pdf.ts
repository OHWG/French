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

  // Fall back to Anthropic API for scanned / image PDFs
  if (!process.env.ANTHROPIC_API_KEY) {
    return "";
  }

  // Call the Anthropic API directly via fetch to avoid SDK btoa encoding issues
  const base64 = buffer.toString("base64");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
    },
    body: JSON.stringify({
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
            },
            {
              type: "text",
              text: "Extract and transcribe ALL text from this PDF. Include vocabulary lists, grammar explanations, dialogues, exercises, and any other text content. Preserve the structure. Output only the extracted text, no commentary.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic PDF extraction failed (${response.status}): ${err}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  return data.content.find((c) => c.type === "text")?.text ?? "";
}
