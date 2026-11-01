import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { taskCreateSchema, TaskCreateInput } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')

    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
      },
      include: {
        project: true,
        assignee: true,
        tags: { include: { tag: true } },
        comments: { include: { author: true } },
        aiInsights: true,
        subTasks: true,
        dependencies: { include: { dependsOn: true } },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = taskCreateSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        projectId: validatedData.projectId,
        assigneeId: validatedData.assigneeId,
        parentTaskId: validatedData.parentTaskId,
        status: validatedData.status || 'TODO',
        priority: validatedData.priority || 'MEDIUM',
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        estimatedHours: validatedData.estimatedHours,
        order: 0,
      },
      include: {
        project: true,
        assignee: true,
        tags: { include: { tag: true } },
      },
    })

    // Handle tags
    if (validatedData.tags && validatedData.tags.length > 0) {
      await prisma.taskTagRelation.createMany({
        data: validatedData.tags.map(tagName => ({
          taskId: task.id,
          tagId: tagName, // In real app, create/find tag first
        })),
        skipDuplicates: true,
      })
    }

    // Handle dependencies
    if (validatedData.dependsOnIds && validatedData.dependsOnIds.length > 0) {
      await prisma.taskDependency.createMany({
        data: validatedData.dependsOnIds.map(dependsOnId => ({
          taskId: task.id,
          dependsOnId,
        })),
        skipDuplicates: true,
      })
    }

    // Trigger AI analysis
    // In production, this would be async via queue
    // await aiService.generateInsights(task)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}