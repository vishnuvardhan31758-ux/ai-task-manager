import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "ARCHIVED"] as const;
const allowedPriority = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

async function ensureDemoUser() {
  return prisma.user.upsert({
    where: { email: "demo@local.app" },
    update: { name: "Demo User" },
    create: {
      email: "demo@local.app",
      name: "Demo User",
      passwordHash: "demo-user",
    },
  });
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const status = allowedStatuses.includes(String(body.status || "TODO") as (typeof allowedStatuses)[number])
      ? (String(body.status || "TODO") as (typeof allowedStatuses)[number])
      : "TODO";

    const priority = allowedPriority.includes(String(body.priority || "MEDIUM") as (typeof allowedPriority)[number])
      ? (String(body.priority || "MEDIUM") as (typeof allowedPriority)[number])
      : "MEDIUM";

    const projectId = typeof body.projectId === "string" && body.projectId.trim() ? body.projectId : null;
    const description = typeof body.description === "string" ? body.description : null;

    await ensureDemoUser();

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        projectId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        estimatedHours: body.estimatedHours !== undefined && body.estimatedHours !== null ? Number(body.estimatedHours) : null,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
