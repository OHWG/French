/** Encode raw bytes to base64 without relying on Buffer or btoa() */
function bytesToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i + 2 < len ? chars[b2 & 63] : "=";
  }
  return result;
}

export async function extractTextFromBuffer(bytes: Uint8Array): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. Cannot extract text from PDF.");
  }

  // Validate the key only contains printable ASCII (common issue: corrupted copy-paste)
  for (let i = 0; i < process.env.ANTHROPIC_API_KEY.length; i++) {
    const code = process.env.ANTHROPIC_API_KEY.charCodeAt(i);
    if (code > 127) {
      throw new Error(
        `ANTHROPIC_API_KEY contains an invalid character at position ${i} (value ${code}). ` +
        `Please re-copy the key from console.anthropic.com and update it in Vercel Environment Variables.`
      );
    }
  }

  const base64 = bytesToBase64(bytes);

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
