import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import LogoutButton from "./logout-button";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="bg-white" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="hidden sm:flex shrink-0 w-9 h-9 rounded-full items-center justify-center"
              style={{ border: "2px solid var(--accent)" }}
              aria-hidden="true"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 truncate">
                Sistema de Gestión de TCU
              </h1>
              <p className="text-xs text-slate-500 truncate">
                Prácticas Profesionales y Trabajo Comunal Universitario
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-full pr-3 pl-1 py-1 transition-colors hover:bg-[var(--accent-soft)]"
              title="Mi perfil"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {initials(session.name)}
              </span>
              <span className="hidden sm:block text-right">
                <span className="block text-sm font-medium text-slate-900 leading-tight">
                  {session.name}
                </span>
                <span className="block text-xs text-slate-500 leading-tight">
                  {ROLE_LABELS[session.role as Role]}
                </span>
              </span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
