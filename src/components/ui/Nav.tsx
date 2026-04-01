"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lessons", label: "My Lessons" },
  { href: "/lessons/new", label: "+ New Lesson" },
  { href: "/workbooks", label: "Workbooks" },
];

export default function Nav({ userName, isAdmin }: { userName?: string | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg tracking-tight flex items-center gap-2">
          <span className="text-blue-300">🇫🇷</span> AF Study
        </span>
        <div className="hidden sm:flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                pathname.startsWith(l.href)
                  ? "bg-white/20 font-semibold"
                  : "hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-md text-sm text-yellow-300 hover:bg-white/10 transition"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {userName && <span className="text-blue-300 text-sm hidden sm:block">{userName}</span>}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm border border-white/30 rounded-md px-3 py-1.5 hover:bg-white/10 transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
