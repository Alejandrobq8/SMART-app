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
npx prisma migrate dev   # crea/actualiza la base de datos SQLite
npm run db:seed          # carga usuarios y datos de ejemplo
npm run dev              # http://localhost:3000
```

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
- Expediente centralizado por estudiante (carrera, tipo de proceso, estado,
  asesor, organización).
- Bitácora de horas: registro por el estudiante, aprobación/rechazo por
  asesor u organización.
- Gestión de entregables: carga, revisión y aprobación.
- Asignación de estudiantes a asesores y organizaciones (coordinación).
- Notificaciones internas por evento (nuevas horas, entregables, decisiones).
- Tablero de coordinación con reportes por estado.
- Administración de usuarios y organizaciones (rol admin/coordinación).

## Fuera de alcance (según el acta)

Integración financiera, matrícula académica, app móvil nativa, migración de
datos históricos, soporte post-cierre de cuatrimestre e infraestructura de
producción.
