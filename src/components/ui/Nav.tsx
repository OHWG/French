"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lessons", label: "My Lessons" },
  { href: "/lessons/new", label: "+ Upload" },
  { href: "/workbooks", label: "Workbooks" },
  { href: "/exams", label: "Mock Exams" },
];

export default function Nav({ userName, isAdmin }: { userName?: string | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="text-white px-6 py-0 shadow-lg" style={{ background: "#003189" }}>
      <div className="max-w-6xl mx-auto flex items-stretch justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 py-3 mr-6 flex-shrink-0">
          {/* Mini tricolour */}
          <div className="flex rounded overflow-hidden h-5">
            <div className="w-1.5" style={{ background: "#003189", border: "1px solid rgba(255,255,255,0.3)" }} />
            <div className="w-1.5 bg-white" />
            <div className="w-1.5" style={{ background: "#EF3340" }} />
          </div>
          <span className="font-bold text-sm tracking-wide hidden sm:block" style={{ color: "rgba(255,255,255,0.95)" }}>
            Alliance Française
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-stretch gap-0.5 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center px-3 py-3 text-sm whitespace-nowrap transition border-b-2"
                style={{
                  borderBottomColor: active ? "#EF3340" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.7)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {l.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center px-3 py-3 text-sm transition border-b-2"
              style={{ borderBottomColor: "transparent", color: "#fbbf24" }}
            >
              Admin
            </Link>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          {userName && (
            <span className="text-xs hidden md:block" style={{ color: "rgba(255,255,255,0.6)" }}>
              {userName}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs px-3 py-1.5 rounded transition"
            style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
