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
      where: { owner: { email: "demo@local.app" }, isArchived: false },
      include: { _count: { select: { tasks: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(projects, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100) {
      return NextResponse.json({ error: "Project name is required and must be under 100 characters" }, { status: 400 });
    }
    const user = await ensureDemoUser();
    const project = await prisma.project.create({
      data: {
        name,
        description: typeof body.description === "string" ? body.description.slice(0, 2000) : null,
        color: /^#[0-9a-fA-F]{6}$/.test(body.color) ? body.color : "#3B82F6",
        ownerId: user.id,
      },
      include: { _count: { select: { tasks: true } } },
    });
    return NextResponse.json(project, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 400 });
  }
}
