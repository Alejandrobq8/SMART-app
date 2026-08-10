# ADR-0001: Marketplace de oportunidades vs. asignación directa por Coordinación

**Status:** Proposed
**Date:** 2026-08-09
**Deciders:** Coordinación de Prácticas/TCU (product owner), equipo de desarrollo

## Context

El tablero Trello tiene 10 tarjetas de backlog (PB-04 a PB-10, PB-15, PB-19, PB-20) que describen
un modelo de "marketplace": empresas se registran, publican ofertas de Práctica/TCU, estudiantes
buscan y se postulan, la universidad valida requisitos, la empresa revisa postulaciones y cierra la
oferta, y al final ambas partes se califican mutuamente.

El MVP construido hasta ahora sigue un modelo distinto, y esa diferencia no es un accidente sino una
decisión ya tomada dos veces:

- **PB-01 (registro de estudiante)** se resolvió documentando en el README por qué *no* hay
  autorregistro: el expediente (`StudentProfile`) creado por Coordinación es la fuente de verdad de
  quién es estudiante activo, y abrir alta pública generaría cuentas huérfanas ([0b0991a]).
- **PB-03 (completar perfil académico)** se resolvió separando perfil personal (editable por el
  usuario) de expediente académico (carné, carrera, asesor, organización — exclusivo de
  Coordinación), documentado en el commit [4f3460d].
- El esquema de datos actual (`prisma/schema.prisma`) no tiene ni `Offer`, ni `Application`, ni un
  estado de aprobación en `Organization`. La asignación asesor/organización la hace Coordinación
  directamente vía un formulario (`assign-student-form.tsx`), y una vez que el proceso arranca
  (`status !== NOT_STARTED`) la organización queda bloqueada para edición — es una invariante de
  integridad del expediente, no un detalle de UI.

En resumen: el sistema hoy es un **sistema de gestión y seguimiento de expedientes** administrado
por Coordinación, no un mercado abierto de oportunidades. Las 10 tarjetas de marketplace representan
un modelo de producto distinto al que efectivamente se construyó, y no se puede empezar ninguna sin
antes decidir cómo (o si) coexiste con el modelo actual — porque tocan la misma invariante que ya se
protegió dos veces: quién tiene autoridad para decidir la asignación estudiante–organización.

## Decision

*(Pendiente de confirmación del equipo — este ADR presenta las opciones para que Coordinación y
desarrollo decidan antes de que se toque código de PB-04 en adelante.)*

## Options Considered

### Option A: Marketplace reemplaza la asignación directa

Se elimina (o se deja en desuso) el flujo actual donde Coordinación asigna asesor/organización a
mano. En su lugar, las empresas publican ofertas, los estudiantes se postulan, y la aceptación de
una postulación es lo que crea el vínculo `StudentProfile.organizationId`.

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Alta — nuevo modelo de datos (`Offer`, `Application`, aprobación de `Organization`), nuevos roles de flujo, y hay que decidir qué pasa con expedientes ya asignados manualmente |
| Costo | Alto — reescribe una invariante central (`assign-student-form.tsx`, el bloqueo de organización en curso) en vez de extenderla |
| Escalabilidad | Buena si el volumen de organizaciones/ofertas crece; sobredimensionado si el número de empresas por cuatrimestre es pequeño (como ya se concluyó para autorregistro en PB-01) |
| Alineación con el acta | Sin confirmar — el acta citada en el README describe "un sistema de gestión interno", no un portal público, lo mismo que motivó rechazar autorregistro |

**Pros:** modelo más flexible a largo plazo; da autonomía a empresas y estudiantes.
**Contras:** contradice directamente la razón dada en PB-01/PB-03 para centralizar el control en
Coordinación; alto riesgo de dejar expedientes en estados inconsistentes durante la transición.

### Option B: Marketplace coexiste como canal alternativo, Coordinación conserva autoridad final

Se agrega el flujo de publicación/postulación como una forma de *descubrir* organizaciones, pero la
asignación final (`StudentProfile.organizationId`) solo se confirma cuando Coordinación aprueba la
postulación aceptada — reutilizando el mismo campo y la misma invariante de bloqueo que ya existe.
Equivale a tratar una `Application` aceptada como una propuesta que alimenta el formulario de
asignación actual, no como una asignación automática.

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Media-alta — mismo modelo de datos nuevo que la Opción A, pero la integración con el modelo existente es aditiva, no destructiva |
| Costo | Medio — `assign-student-form.tsx` y el bloqueo post-inicio se mantienen intactos; se les agrega una fuente de datos adicional (postulación aceptada) |
| Escalabilidad | Buena — soporta volumen creciente de organizaciones sin perder el control de Coordinación |
| Alineación con el acta | Mejor — preserva la invariante ya documentada ("el expediente creado por coordinación es la fuente de verdad") en vez de contradecirla |

**Pros:** no reabre una decisión ya tomada y justificada dos veces; Coordinación mantiene el mismo
punto de control que hoy; el trabajo es incremental sobre el modelo existente.
**Contras:** más piezas en juego (dos caminos hacia la misma asignación); hay que definir con
claridad qué pasa si una postulación aceptada choca con una asignación manual ya hecha.

### Option C: Archivar las tarjetas de marketplace, no son parte del alcance real

Se confirma que estas 10 tarjetas vienen de un backlog o plantilla anterior al pivote hacia
"gestión centralizada por Coordinación", y no reflejan lo que el acta de constitución realmente pide.
Se archivan o se reformulan como ideas futuras sin compromiso de entrega.

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Ninguna — no se construye nada |
| Costo | Ninguno a corto plazo; costo de oportunidad si el equipo sí necesitaba esta funcionalidad y se descarta por error |
| Escalabilidad | N/A |
| Alineación con el acta | La más alta, si el acta efectivamente no pide un mercado abierto (a confirmar releyendo el documento fuente) |

**Pros:** cero riesgo técnico; evita construir sobre una premisa de producto no confirmada; consistente
con el patrón ya usado en PB-01/PB-03 de resolver con una decisión documentada en vez de código.
**Contras:** si el acta sí exige estas funciones (falta releerla con el equipo para confirmarlo), se
pierde tiempo si se archivan por error.

## Trade-off Analysis

El eje de decisión real no es técnico sino de producto: **¿quién tiene la autoridad final para decidir
la asignación estudiante–organización?** Hoy es Coordinación, sin excepción, y esa centralización es
una decisión de diseño explícita y ya justificada por escrito dos veces (0b0991a, 4f3460d). Cualquier
opción que reintroduzca un camino donde una organización o un estudiante puedan crear ese vínculo sin
pasar por Coordinación (Opción A) está en tensión directa con esa decisión y debería tener una
justificación de negocio igual de explícita antes de implementarse.

La Opción B es la que menos invalida el trabajo ya hecho: reutiliza la misma invariante de bloqueo
post-inicio y el mismo campo `organizationId`, tratando la postulación como una fuente de candidatos
en vez de una asignación automática. Es más código que la Opción C, pero no exige deshacer nada de lo
construido.

La Opción C es la más barata y la más consistente con el patrón que el equipo ya ha seguido dos veces
(resolver con una decisión documentada en vez de con código), pero depende de un hecho no verificado
todavía: que el acta de constitución realmente no pide un marketplace. Vale la pena releer el acta
citada en el README antes de decidir entre B y C — si el acta no lo pide, C es estrictamente mejor que
B (mismo resultado de producto, cero costo).

## Consequences

- Si se elige **A**: hay que planear una migración de los expedientes ya asignados manualmente y
  reescribir el bloqueo de organización en `assign-student-form.tsx`; alto riesgo, requiere sign-off
  explícito de Coordinación por revertir una decisión ya documentada.
- Si se elige **B**: `StudentProfile.organizationId` sigue siendo la única fuente de verdad del
  vínculo activo; se añade `Offer`/`Application` como capa de descubrimiento que alimenta —pero no
  reemplaza— el formulario de asignación existente. Falta definir el flujo cuando una postulación
  aceptada y una asignación manual entran en conflicto.
- Si se elige **C**: las tarjetas PB-04 a PB-10, PB-15, PB-19, PB-20 se archivan o se reformulan sin
  compromiso de entrega; no hay cambios de código ni de esquema.
- En cualquier caso, esta decisión debe quedar documentada en el README junto a las de PB-01/PB-03,
  para que el próximo lector del backlog no vuelva a proponer estas 10 tarjetas sin ver el contexto.

## Action Items

1. [ ] Releer el acta de constitución citada en el README con el equipo/Coordinación para confirmar
       si el marketplace es un requisito real o un remanente de un backlog anterior.
2. [ ] Decidir entre Opción A/B/C con Coordinación como decisor final (es quien pierde o mantiene
       autoridad sobre la asignación).
3. [ ] Si se elige B o C, actualizar este ADR a `Accepted` y documentar la decisión en el README,
       siguiendo el mismo formato usado en la sección "Alta de cuentas: por qué no hay autorregistro".
4. [ ] Si se elige C, mover/archivar PB-04 a PB-10, PB-15, PB-19, PB-20 en Trello con referencia a
       este ADR.
5. [ ] Si se elige B, desglosar el modelo de datos (`Offer`, `Application`, `Organization.status`) y
       el orden de fases en tarjetas nuevas, ligadas a este ADR.
