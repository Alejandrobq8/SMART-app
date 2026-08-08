import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("123456", 10);

  await prisma.notification.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.hoursLog.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const coordinacion = await prisma.user.create({
    data: {
      name: "Clarence Ricketts Torres",
      email: "coordinacion@ulacit.ac.cr",
      passwordHash: password,
      role: "COORDINATION",
    },
  });

  const asesor = await prisma.user.create({
    data: {
      name: "María Fernández Solano",
      email: "asesor@ulacit.ac.cr",
      passwordHash: password,
      role: "ADVISOR",
    },
  });

  const orgContact = await prisma.user.create({
    data: {
      name: "Carlos Jiménez Rojas",
      email: "organizacion@ulacit.ac.cr",
      passwordHash: password,
      role: "ORGANIZATION",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Administrador del sistema",
      email: "admin@ulacit.ac.cr",
      passwordHash: password,
      role: "ADMIN",
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: "Fundación Comunidad Verde",
      description: "ONG de proyectos ambientales y comunitarios",
      contactUserId: orgContact.id,
    },
  });

  const estudiante = await prisma.user.create({
    data: {
      name: "Alejandro Barquero Quirós",
      email: "estudiante@ulacit.ac.cr",
      passwordHash: password,
      role: "STUDENT",
    },
  });

  const estudiante2 = await prisma.user.create({
    data: {
      name: "Nicole Benavides Soto",
      email: "estudiante2@ulacit.ac.cr",
      passwordHash: password,
      role: "STUDENT",
    },
  });

  const profile1 = await prisma.studentProfile.create({
    data: {
      userId: estudiante.id,
      studentCode: "2021045612",
      career: "Ingeniería en Sistemas",
      processType: "TCU",
      requiredHours: 150,
      status: "IN_PROGRESS",
      advisorId: asesor.id,
      organizationId: organization.id,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: estudiante2.id,
      studentCode: "2021078934",
      career: "Administración de Negocios",
      processType: "PRACTICE",
      requiredHours: 300,
      advisorId: asesor.id,
    },
  });

  await prisma.hoursLog.create({
    data: {
      studentProfileId: profile1.id,
      date: new Date("2026-06-15"),
      hours: 8,
      description: "Levantamiento de necesidades con la organización",
      status: "APPROVED",
      approvedById: asesor.id,
      approvedAt: new Date("2026-06-16"),
    },
  });

  await prisma.hoursLog.create({
    data: {
      studentProfileId: profile1.id,
      date: new Date("2026-06-20"),
      hours: 6,
      description: "Taller comunitario de reciclaje",
      status: "PENDING",
    },
  });

  await prisma.deliverable.create({
    data: {
      studentProfileId: profile1.id,
      title: "Plan de trabajo del TCU",
      description: "Documento inicial con cronograma y actividades",
      fileName: "plan-trabajo-tcu.pdf",
      status: "APPROVED",
      reviewedById: asesor.id,
      reviewedAt: new Date("2026-06-18"),
    },
  });

  await prisma.deliverable.create({
    data: {
      studentProfileId: profile1.id,
      title: "Informe de avance 1",
      description: "Primer informe de avance del proyecto comunal",
      fileName: "informe-avance-1.pdf",
      status: "PENDING",
    },
  });

  await prisma.notification.create({
    data: {
      userId: estudiante.id,
      message: "Bienvenido/a al Sistema de Gestión de TCU.",
    },
  });

  console.log("Seed completado.");
  console.log("Coordinación:", coordinacion.email);
  console.log("Asesor:", asesor.email);
  console.log("Organización:", orgContact.email);
  console.log("Admin:", admin.email);
  console.log("Estudiante:", estudiante.email);
  console.log("Contraseña para todos los usuarios: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
