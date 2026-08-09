// Textos derivados de estado que se reutilizan entre un server component y
// sus pruebas (no se puede importar page.tsx directamente en un test sin
// arrastrar next/headers, así que la condición vive acá como función pura).

export function studentSelectorEmptyMessage(
  usersWithoutProfileCount: number
): string | null {
  if (usersWithoutProfileCount > 0) return null;

  return (
    "No hay usuarios con rol Estudiante pendientes de expediente. Todos " +
    "los estudiantes registrados ya tienen uno, o aún no has creado ninguna " +
    "cuenta de estudiante desde Administración de usuarios."
  );
}
