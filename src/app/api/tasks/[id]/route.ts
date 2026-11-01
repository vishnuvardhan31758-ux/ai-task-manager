import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiService } from '@/lib/ai-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: true,
        tags: { include: { tag: true } },
        comments: { include: { author: true } },
        aiInsights: true,
        subTasks: true,
        dependencies: { include: { dependsOn: true } },
        dependents: { include: { task: true } },
        timeEntries: { include: { user: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        completedAt: body.status === 'DONE' && task.status !== 'DONE' ? new Date() : task.completedAt,
        estimatedHours: body.estimatedHours,
        actualHours: body.actualHours,
        order: body.order,
        projectId: body.projectId,
        assigneeId: body.assigneeId,
        parentTaskId: body.parentTaskId,
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
    })

    // Generate AI insights if task was updated significantly
    if (body.title !== task.title || body.description !== task.description) {
      // In production, this would be async via queue
      // await aiService.generateInsights(updatedTask)
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body // 'duplicate', 'add_subtask', 'add_comment', 'add_time_entry'

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    switch (action) {
      case 'duplicate': {
        const newTask = await prisma.task.create({
          data: {
            title: `${task.title} (Copy)`,
            description: task.description,
            projectId: task.projectId,
            assigneeId: task.assigneeId,
            parentTaskId: task.parentTaskId,
            status: 'TODO',
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            order: task.order + 1,
          },
        })
        return NextResponse.json(newTask, { status: 201 })
      }
      case 'add_subtask': {
        const { title } = await request.json()
        const subtask = await prisma.task.create({
          data: {
            title,
            parentTaskId: id,
            projectId: task.projectId,
            status: 'TODO',
            priority: 'MEDIUM',
          },
        })
        return NextResponse.json(subtask, { status: 201 })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error performing task action:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}