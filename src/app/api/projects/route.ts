import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const user = await ensureDemoUser();

    const project = await prisma.project.create({
      data: {
        name,
        description: body.description ? String(body.description) : null,
        color: body.color ? String(body.color) : "#3B82F6",
        icon: body.icon ? String(body.icon) : null,
        ownerId: user.id,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
