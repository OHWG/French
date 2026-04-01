import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminWorkbookUpload from "@/components/lessons/AdminWorkbookUpload";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-red-100 text-red-800",
};

export default async function WorkbooksPage() {
  const session = await auth();
  const user = session!.user as { role?: string };
  const isAdmin = user.role === "admin";

  const workbooks = await prisma.workbook.findMany({ orderBy: { cefrLevel: "asc" } });
  const workbookMap = Object.fromEntries(workbooks.map((w) => [w.cefrLevel, w]));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Workbooks</h1>
          <p className="text-gray-500 text-sm mt-1">
            Alliance Française central course materials by level. Select your level when uploading a lesson.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {CEFR_LEVELS.map((level) => {
          const wb = workbookMap[level];
          return (
            <div key={level} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${CEFR_COLORS[level]}`}>
                  {level}
                </span>
                {wb && <span className="text-xs text-green-600">✓ Uploaded</span>}
              </div>
              {wb ? (
                <>
                  <p className="font-medium text-gray-800 text-sm mb-1">{wb.title}</p>
                  <p className="text-xs text-gray-400">
                    {wb.rawText.length > 0 ? `${Math.round(wb.rawText.length / 1000)}k chars extracted` : "No text extracted"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No workbook uploaded yet.</p>
              )}
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <AdminWorkbookUpload cefrLevel={level} existingTitle={wb?.title} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 rounded-xl p-5 text-sm text-blue-700">
        <strong>How workbooks work:</strong> When you upload a lesson note and select a CEFR level, it automatically links to the central workbook for that level. The AI then combines both documents when generating your exercises — giving you richer, more contextual activities.
        {!isAdmin && (
          <p className="mt-2 text-blue-500">Only admins can upload workbooks. Contact your administrator to get them added.</p>
        )}
        <p className="mt-2">
          <Link href="/lessons/new" className="underline font-medium">Upload a lesson note →</Link>
        </p>
      </div>
    </div>
  );
}
