import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@local.app" },
    update: { name: "Demo User" },
    create: {
      email: "demo@local.app",
      name: "Demo User",
      passwordHash: "demo-user",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "demo-project" },
    update: {},
    create: {
      id: "demo-project",
      name: "Product Launch",
      description: "Demo tasks for the MVP",
      color: "#3B82F6",
      ownerId: demoUser.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Finalize dashboard layout",
        description: "Polish the task manager UI and improve spacing",
        status: "TODO",
        priority: "MEDIUM",
        projectId: project.id,
      },
      {
        title: "Configure deployment environment",
        description: "Set up production configuration and connectivity checks",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: project.id,
      },
      {
        title: "Ship MVP demo",
        description: "Validate task creation and project flows",
        status: "DONE",
        priority: "LOW",
        projectId: project.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
