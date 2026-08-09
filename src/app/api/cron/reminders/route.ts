import { NextRequest, NextResponse } from "next/server";
import { runOverdueReminders } from "@/lib/reminders";

// Gancho opcional para un scheduler real en producción (Vercel Cron, cron
// del sistema operativo, etc.). En desarrollo local los recordatorios ya
// se generan automáticamente al cargar el dashboard (ver page.tsx), así
// que esta ruta no es necesaria para el flujo normal de la app.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await runOverdueReminders();
  return NextResponse.json({ ok: true });
}
