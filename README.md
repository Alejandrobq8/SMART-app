# Sistema de Gestión de Prácticas Profesionales y TCU

MVP funcional del sistema descrito en el Acta de Constitución del Proyecto
(ULACIT — Pruebas de Aseguramiento de la Calidad del Software). Pensado
**solo para ambiente de desarrollo local** (no hay despliegue configurado).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma 5** + **SQLite** (base de datos local en `prisma/dev.db`)
- **Tailwind CSS 4**
- Autenticación propia (bcrypt + sesión JWT en cookie httpOnly) — sin
  dependencias externas ni servicios de terceros

## Puesta en marcha

```bash
npm install
cp .env.example .env     # configura DATABASE_URL y AUTH_SECRET (ver abajo)
npx prisma migrate dev   # crea/actualiza la base de datos SQLite
npm run db:seed          # carga usuarios y datos de ejemplo
npm run dev              # http://localhost:3000
```

### Variables de entorno

El repo no incluye `.env` (está en `.gitignore`); hay que crearlo a partir
de `.env.example`:

| Variable       | Requerida | Descripción                                                                 |
| -------------- | :-------: | ---------------------------------------------------------------------------- |
| `DATABASE_URL` |    Sí     | Ruta del archivo SQLite para Prisma. `file:./dev.db` funciona sin cambios.  |
| `AUTH_SECRET`  |    Sí     | Secreto para firmar la sesión JWT. Sin él, cae a un valor inseguro hardcodeado — genera uno propio incluso en local (`openssl rand -base64 32`). |
| `CRON_SECRET`  |    No     | Protege `/api/cron/reminders` si se engancha a un scheduler en producción. No es necesaria para uso local. |

## Usuarios de prueba (seed)

| Rol                    | Correo                          | Contraseña |
| ----------------------- | -------------------------------- | ---------- |
| Coordinación de carrera | coordinacion@ulacit.ac.cr        | 123456     |
| Profesor asesor         | asesor@ulacit.ac.cr              | 123456     |
| Estudiante               | estudiante@ulacit.ac.cr          | 123456     |
| Organización externa    | organizacion@ulacit.ac.cr        | 123456     |
| Administrador           | admin@ulacit.ac.cr               | 123456     |

## Proceso de la Práctica Profesional y el TCU en la app

El sistema modela el flujo real que hoy se hace por correo y hojas de
cálculo sueltas. A continuación el recorrido completo, desde que se abre
el expediente hasta que el estudiante lo completa.

### 0. Alta inicial (Coordinación / Administrador)

Un estudiante no puede usar el sistema hasta que exista su cuenta y su
expediente:

1. **Administrador o coordinación** crea el `Usuario` del estudiante
   (nombre, correo, contraseña, rol *Estudiante*) desde "Administración
   de usuarios".
2. **Coordinación** crea su **expediente** desde "Crear expediente de
   estudiante": carné, carrera, tipo de proceso (**Práctica profesional**
   o **TCU**) y las horas requeridas (p. ej. 150 h para TCU, 300 h para
   práctica, según la carrera).
3. **Coordinación** asigna un **profesor asesor** y, si aplica, una
   **organización externa** desde "Asignar asesor / organización a un
   estudiante". Esto puede hacerse en cualquier momento posterior; el
   estudiante puede empezar a registrar horas aunque aún no tenga
   asignaciones, pero nadie podrá aprobarlas hasta que tenga asesor.

### 1. Ejecución — el estudiante trabaja y reporta

El estudiante ve su expediente (carné, carrera, tipo de proceso, asesor,
organización, barra de progreso de horas) y desde ahí:

- **Registra horas** trabajadas: fecha, cantidad, descripción de la
  actividad. Cada registro entra como *Pendiente* y genera una
  notificación automática a su asesor.
- **Sube entregables**: título, descripción y nombre de archivo (informes
  de avance, plan de trabajo, informe final, etc.). También entra como
  *Pendiente* y notifica al asesor.

Nada de esto se autoaprueba: el estudiante solo *propone*, no valida su
propio avance.

### 2. Validación — asesor y/o organización revisan

El **profesor asesor** (y la **organización externa**, si el proceso lo
requiere) ve en su tablero solo a los estudiantes que tiene asignados, y
dos colas de trabajo:

- **Horas pendientes de aprobación**: aprueba o rechaza cada registro,
  con un comentario opcional. Al decidir, se notifica al estudiante y
  las horas aprobadas se suman a su progreso.
- **Entregables pendientes de revisión**: puede marcarlos como
  *Aprobado*, dejarlos *En revisión* (si falta algo por corregir) o
  *Rechazarlos*, también con comentario.

Cada aprobación/rechazo dispara un recálculo automático del **estado
general** del expediente:

| Estado                  | Condición                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `Sin iniciar`             | No hay horas aprobadas ni entregables registrados.                |
| `En progreso`             | Hay actividad, pero las horas aprobadas no llegan al requerido.   |
| `Horas completadas`       | Ya cumplió las horas, sin entregables pendientes de aprobar aún.  |
| `Entregables pendientes`  | Ya cumplió las horas, pero aún hay entregables sin aprobar.       |
| `Completado`              | Horas cumplidas y todos los entregables aprobados.                |

Este cálculo lo hace el sistema (`recomputeStatus` en
`src/lib/actions.ts`); nadie lo edita manualmente.

### 3. Seguimiento — coordinación supervisa todo el proceso

**Coordinación** (y el administrador) tienen el **tablero general**: un
resumen con la cantidad de estudiantes en cada estado y una tabla
completa (estudiante, carrera, asesor, organización, estado, horas)
para consultar en tiempo real quién va atrasado, sin pedir reportes por
correo. Desde ahí también reasignan asesor/organización si hace falta,
y dan de alta nuevas organizaciones receptoras.

### 4. Cierre

Cuando el estado del expediente llega a `Completado`, el proceso del
estudiante está formalmente cerrado dentro del sistema: cumplió las
horas requeridas y todos sus entregables fueron aprobados por su
asesor/organización. (La generación del informe final y el acta de
cierre del curso quedan fuera del MVP — ver "Fuera de alcance".)

### Resumen visual del flujo

```
Coordinación          Estudiante              Asesor / Organización
─────────────         ─────────────           ──────────────────────
crea usuario     →
crea expediente  →
asigna asesor    →
                       registra horas    →     aprueba / rechaza horas
                       sube entregable   →     aprueba / revisa / rechaza
                                                        │
                                                        ▼
                                          recálculo automático de estado
                                                        │
supervisa tablero ◄─────────────────────────────────────┘
general y reportes
```

## Módulos implementados

- Usuarios y roles (estudiante, profesor asesor, coordinación, organización
  externa, administrador) con control de acceso por rol.
- Expediente centralizado por estudiante (carrera, periodo, tipo de proceso,
  estado, asesor, organización).
- Bitácora de horas: registro por el estudiante, aprobación/rechazo por
  asesor u organización (con confirmación antes de aprobar/rechazar).
- Gestión de entregables: carga, revisión y aprobación.
- Asignación de estudiantes a asesores y organizaciones (coordinación).
- Notificaciones internas por evento (nuevas horas, entregables, decisiones)
  y recordatorios automáticos de aprobaciones pendientes con más de 3 días
  (ver "Recordatorios automáticos" abajo).
- Tablero de coordinación con reportes por estado, carrera y periodo, con
  filtros.
- Administración de usuarios y organizaciones (rol admin/coordinación).
- Edición de perfil personal (nombre, teléfono, contraseña) por cualquier
  usuario desde "Mi perfil".
- Recuperación de contraseña con token de un solo uso (ver abajo).

## Edición de perfil personal

Cualquier usuario puede actualizar su nombre y teléfono, y cambiar su
contraseña, desde `/dashboard/profile` ("Mi perfil" en el encabezado). El
correo (identidad de inicio de sesión) y los datos del expediente académico
(carné, carrera, asesor, organización) no son editables por el propio
usuario — eso sigue siendo responsabilidad exclusiva de Coordinación.

## Recuperación de contraseña

Flujo de "olvidé mi contraseña" (`/forgot-password` → `/reset-password`) con
token de un solo uso, válido por 30 minutos, generado en
`PasswordResetToken`. Como la app no tiene ningún servicio de correo
configurado (ni debería, según el acta), el enlace de recuperación se
muestra directamente en pantalla tras la solicitud en vez de enviarse por
correo — mismo criterio que ya usa la pantalla de login al exponer las
credenciales de prueba. En un despliegue real, ese paso se reemplazaría por
un envío de correo con el mismo enlace.

## Recordatorios automáticos

Cuando una hora o un entregable lleva más de 3 días en estado *Pendiente*,
el sistema notifica automáticamente al asesor (con un enfriamiento de 3 días
para no duplicar el aviso). No hay infraestructura de cron en este stack, así
que la verificación corre al cargar el dashboard de asesor/organización y de
coordinación (`runOverdueReminders()` en `src/lib/reminders.ts`). También
existe `/api/cron/reminders` (protegida por la variable de entorno
`CRON_SECRET`) para quien quiera engancharla a un scheduler real en un
despliegue de producción — no es necesaria para el uso normal en local.

## Alta de cuentas: por qué no hay autorregistro

El acta pide un sistema de gestión interno, no un portal público: los
"usuarios" del sistema son estudiantes ya matriculados en un curso
específico de Práctica Profesional o TCU, cuyo expediente es abierto por
**Coordinación** a partir de datos que ya existen en el sistema académico
(carné, carrera, tipo de proceso). Permitir que cualquier persona se
autorregistre generaría cuentas huérfanas sin expediente y rompería la
invariante que hoy sostiene todo el flujo: *el expediente creado por
coordinación es la fuente de verdad de quién es estudiante activo*.

Por eso el alta se mantiene controlada (Administrador o Coordinación crea
la cuenta desde "Administración de usuarios", como ya se describe en el
paso 0 del flujo más abajo) en vez de implementar un formulario de registro
público. Si en el futuro el volumen de altas por cuatrimestre lo justifica,
la extensión natural sería una importación masiva (CSV) desde Coordinación,
no autorregistro abierto.

## Fuera de alcance (según el acta)

Integración financiera, matrícula académica, app móvil nativa, migración de
datos históricos, soporte post-cierre de cuatrimestre e infraestructura de
producción.
