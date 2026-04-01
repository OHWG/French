import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alliance Française — Study Platform",
  description: "AI-powered French learning companion for Alliance Française students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
