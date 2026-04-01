import fs from "fs";
import path from "path";

export async function extractTextFromPDF(filePath: string): Promise<string> {
  // pdf-parse requires the file buffer
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text as string;
}

export function getUploadPath(filename: string): string {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return path.join(uploadDir, filename);
}

export function sanitizeFilename(original: string): string {
  const ext = path.extname(original);
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${Date.now()}_${base}${ext}`;
}
