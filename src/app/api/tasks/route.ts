import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "ARCHIVED"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

async function ensureDemoUser() {
  return prisma.user.upsert({
    where: { email: "demo@local.app" },
    update: { name: "Demo User" },
    create: { email: "demo@local.app", name: "Demo User", passwordHash: "demo-user" },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    if (status && !statuses.includes(status as (typeof statuses)[number])) {
      return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
        project: { owner: { email: "demo@local.app" } },
      },
      include: { project: true, tags: { include: { tag: true } }, aiInsights: true },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });
    return NextResponse.json(tasks, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Task title is required and must be under 200 characters" }, { status: 400 });
    }

    const status = statuses.includes(body.status) ? body.status : "TODO";
    const priority = priorities.includes(body.priority) ? body.priority : "MEDIUM";
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const estimatedHours = body.estimatedHours == null ? null : Number(body.estimatedHours);
    if ((dueDate && Number.isNaN(dueDate.getTime())) || (startDate && Number.isNaN(startDate.getTime()))) {
      return NextResponse.json({ error: "Invalid task date" }, { status: 400 });
    }
    if (estimatedHours !== null && (!Number.isFinite(estimatedHours) || estimatedHours <= 0)) {
      return NextResponse.json({ error: "Estimated hours must be a positive number" }, { status: 400 });
    }

    const user = await ensureDemoUser();
    const projectId = typeof body.projectId === "string" && body.projectId.trim() ? body.projectId : null;
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: user.id } });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: typeof body.description === "string" ? body.description.slice(0, 5000) : null,
        status,
        priority,
        projectId,
        dueDate,
        startDate,
        estimatedHours,
      },
      include: { project: true },
    });
    return NextResponse.json(task, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 400 });
  }
}
