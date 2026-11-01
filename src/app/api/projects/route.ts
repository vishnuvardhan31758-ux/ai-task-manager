import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const projects = await prisma.project.findMany({
      where: {
        ...(userId && { ownerId: userId }),
        isArchived: false,
      },
      include: {
        owner: true,
        tasks: {
          where: { status: { notIn: ['DONE', 'ARCHIVED'] } },
          select: { id: true, status: true, priority: true },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color || '#3B82F6',
        icon: body.icon,
        ownerId: body.ownerId,
      },
      include: {
        owner: true,
        _count: { select: { tasks: true } },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}