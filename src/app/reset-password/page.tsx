import Link from "next/link";
import { resetPassword } from "@/lib/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-lg font-semibold text-slate-900">Nueva contraseña</h1>

        {!token ? (
          <p className="text-sm text-red-600 mt-4">
            Enlace inválido: falta el token de recuperación.
          </p>
        ) : (
          <form action={resetPassword} className="mt-4 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nueva contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800"
            >
              Guardar nueva contraseña
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="block text-xs text-slate-500 mt-6 underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
