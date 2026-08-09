import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; token?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const token = params.token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-lg font-semibold text-slate-900">Recuperar contraseña</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          Escribe tu correo institucional. Si existe una cuenta, se genera un
          enlace de un solo uso válido por 30 minutos.
        </p>

        {sent ? (
          token ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                Enlace generado. En producción se enviaría por correo; como
                esta app corre solo en desarrollo local (sin servicio de
                correo configurado), se muestra directamente aquí:
              </p>
              <Link
                href={`/reset-password?token=${token}`}
                className="block text-sm text-slate-900 underline break-all"
              >
                {`/reset-password?token=${token}`}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              Si el correo existe en el sistema, se generó un enlace de
              recuperación.
            </p>
          )
        ) : (
          <form action={requestPasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="usuario@ulacit.ac.cr"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800"
            >
              Enviar enlace de recuperación
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
