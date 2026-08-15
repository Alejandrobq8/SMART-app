"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors hover:border-slate-300"
    >
      Cerrar sesión
    </button>
  );
}
