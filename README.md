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
