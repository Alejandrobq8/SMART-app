import { afterAll, afterEach, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Los server actions llaman requireSession() -> getSession(), que en
// producción lee la cookie httpOnly vía next/headers. Fuera de una
// petición real de Next.js eso lanza, así que se mockea por completo:
// cada test controla qué sesión "está activa" con mockGetSession.
export const mockGetSession = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>(
    "@/lib/auth"
  );
  return { ...actual, getSession: mockGetSession };
});

beforeEach(async () => {
  mockGetSession.mockReset();
  await prisma.notification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.hoursLog.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});
