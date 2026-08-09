import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { updateProfile, changePassword } from "@/lib/actions";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Mi perfil</h2>
        <p className="text-sm text-slate-500">
          Datos personales — {ROLE_LABELS[session.role as Role]}. Los datos
          del expediente académico (carné, carrera, asesor, organización)
          solo puede modificarlos Coordinación.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Datos personales
        </h3>
        <form action={updateProfile} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={user.name}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Correo (no editable)
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="border border-slate-200 bg-slate-50 text-slate-400 rounded-md px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={user.phone ?? ""}
              placeholder="Ej. 8888-8888"
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full"
            />
          </div>
          <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
            Guardar cambios
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Cambiar contraseña
        </h3>
        <form action={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={6}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full"
            />
          </div>
          <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
