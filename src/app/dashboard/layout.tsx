import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/ui/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { name?: string | null; role?: string };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Nav userName={user.name} isAdmin={user.role === "admin"} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
