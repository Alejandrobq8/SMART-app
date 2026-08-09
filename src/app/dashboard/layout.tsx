import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Sistema de Gestión de TCU
            </h1>
            <p className="text-xs text-slate-500">
              Prácticas Profesionales y Trabajo Comunal Universitario
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {session.name}
              </p>
              <p className="text-xs text-slate-500">
                {ROLE_LABELS[session.role as Role]}
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2"
            >
              Mi perfil
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
