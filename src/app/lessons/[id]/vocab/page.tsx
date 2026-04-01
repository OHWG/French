import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function VocabPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: { id, userId: session!.user!.id as string },
    include: { vocabulary: { orderBy: { french: "asc" } } },
  });

  if (!lesson) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/lessons/${id}`} className="text-sm text-gray-400 hover:text-blue-600">← {lesson.title}</Link>
      </div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Vocabulary list</h1>
      <p className="text-gray-500 text-sm mb-6">{lesson.vocabulary.length} words extracted from this lesson</p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">French</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">English</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Example</th>
            </tr>
          </thead>
          <tbody>
            {lesson.vocabulary.map((v) => (
              <tr key={v.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-blue-800">{v.french}</td>
                <td className="px-4 py-3 text-gray-600">{v.english}</td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell text-xs">{v.partOfSpeech ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell text-xs italic">{v.example ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
