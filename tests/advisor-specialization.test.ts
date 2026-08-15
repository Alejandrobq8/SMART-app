import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { assignStudent, createUser } from "@/lib/actions";
import { mockGetSession } from "./setup";

async function createAdvisor(processType: string | null) {
  return prisma.user.create({
    data: {
      name: "Asesor de prueba",
      email: `advisor-${crypto.randomUUID()}@test.local`,
      passwordHash: "x",
      role: "ADVISOR",
      advisorProcessType: processType,
    },
  });
}

async function createStudentUser() {
  return prisma.user.create({
    data: {
      name: "Estudiante de prueba",
      email: `student-${crypto.randomUUID()}@test.local`,
      passwordHash: "x",
      role: "STUDENT",
    },
  });
}

async function createStudentProfileDirect(userId: string, processType: string) {
  return prisma.studentProfile.create({
    data: {
      userId,
      studentCode: `code-${crypto.randomUUID()}`,
      career: "Ingeniería en Sistemas",
      processType,
    },
  });
}

function mockCoordination() {
  mockGetSession.mockResolvedValue({
    userId: "coord-1",
    role: "COORDINATION",
    name: "Coordinación",
    email: "coordinacion@test.local",
  });
}

// Regla: por ahora un asesor solo puede atender un tipo de proceso.
describe("assignStudent — especialización del asesor por tipo de proceso", () => {
  it("lanza si el asesor atiende un tipo de proceso distinto al del estudiante", async () => {
    const advisorPractica = await createAdvisor("PRACTICE");
    const user = await createStudentUser();
    const profile = await createStudentProfileDirect(user.id, "TCU");
    mockCoordination();

    const formData = new FormData();
    formData.set("studentProfileId", profile.id);
    formData.set("advisorId", advisorPractica.id);
    formData.set("organizationId", "");

    await expect(assignStudent(formData)).rejects.toThrow(
      /solo puede atender un tipo de proceso/i
    );
  });

  it("permite asignar un asesor cuyo tipo coincide con el del estudiante", async () => {
    const advisorTcu = await createAdvisor("TCU");
    const user = await createStudentUser();
    const profile = await createStudentProfileDirect(user.id, "TCU");
    mockCoordination();

    const formData = new FormData();
    formData.set("studentProfileId", profile.id);
    formData.set("advisorId", advisorTcu.id);
    formData.set("organizationId", "");

    await expect(assignStudent(formData)).resolves.not.toThrow();
  });

  it("no revalida la especialidad si el asesor no cambia (asignación previa a esta regla)", async () => {
    // Un asesor sin advisorProcessType (dato de antes de esta regla) ya
    // asignado a un estudiante no debe romper al volver a guardar el
    // formulario sin tocar el asesor.
    const advisorLegacy = await createAdvisor(null);
    const user = await createStudentUser();
    const profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentCode: `code-${crypto.randomUUID()}`,
        career: "Ingeniería en Sistemas",
        processType: "TCU",
        advisorId: advisorLegacy.id,
      },
    });
    mockCoordination();

    const org = await prisma.organization.create({ data: { name: "Org de prueba" } });
    const formData = new FormData();
    formData.set("studentProfileId", profile.id);
    formData.set("advisorId", advisorLegacy.id);
    formData.set("organizationId", org.id);

    await expect(assignStudent(formData)).resolves.not.toThrow();
  });
});

describe("createUser — exige tipo de proceso al crear un asesor", () => {
  it("lanza si el rol es ADVISOR y no se indica el tipo de proceso", async () => {
    mockCoordination();

    const formData = new FormData();
    formData.set("name", "Nuevo asesor");
    formData.set("email", `nuevo-${crypto.randomUUID()}@test.local`);
    formData.set("password", "123456");
    formData.set("role", "ADVISOR");

    await expect(createUser(formData)).rejects.toThrow(
      /debes indicar si el asesor atiende/i
    );
  });

  it("crea el asesor cuando sí se indica el tipo de proceso", async () => {
    mockCoordination();

    const email = `nuevo-${crypto.randomUUID()}@test.local`;
    const formData = new FormData();
    formData.set("name", "Nuevo asesor");
    formData.set("email", email);
    formData.set("password", "123456");
    formData.set("role", "ADVISOR");
    formData.set("advisorProcessType", "TCU");

    await expect(createUser(formData)).resolves.not.toThrow();

    const created = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(created.advisorProcessType).toBe("TCU");
  });
});
