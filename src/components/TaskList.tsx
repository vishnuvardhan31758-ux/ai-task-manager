'use client'

import { useState } from 'react'
import { Task, Project, AIInsight, Priority, TaskStatus } from '@prisma/client'
import { TaskForm } from '@/components/TaskForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, ChevronDown, CheckCircle, Clock, Flag, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueDate: Date | null
    estimatedHours: number | null
    project: { id: string; name: string; color: string } | null
    tags: { tag: { id: string; name: string; color: string } }[]
    aiInsights: { id: string; type: string; title: string; confidence: number }[]
  }
  onEdit: (task: any) => void
  onDelete: (id: string) => void
}

const statusColors = {
  TODO: 'bg-slate-500',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-amber-500',
  DONE: 'bg-emerald-500',
  ARCHIVED: 'bg-slate-700',
}

const priorityColors = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
}

const statusLabels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  ARCHIVED: 'Archived',
}

const priorityLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  const daysUntilDue = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  return (
    <Card className="border-slate-800 hover:border-cyan-500/50 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white truncate">{task.title}</h3>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority as keyof typeof priorityColors])}>
                  {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
                </Badge>
                <Badge variant="outline" className={cn('text-xs', statusColors[task.status as keyof typeof statusColors])}>
                  {statusLabels[task.status as keyof typeof statusLabels] || task.status}
                </Badge>
              </div>
            </div>
            
            {task.description && (
              <p className="mt-1 text-sm text-slate-400 line-clamp-2">{task.description}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {task.project && (
                <Badge variant="secondary" style={{ backgroundColor: task.project.color + '20', borderColor: task.project.color }}>
                  <span style={{ color: task.project.color }}>●</span> {task.project.name}
                </Badge>
              )}
              {task.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}>
                  {tag.name}
                </Badge>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              {task.dueDate && (
                <span className={cn('flex items-center gap-1', isOverdue ? 'text-red-400' : 'text-slate-400')}>
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(task.dueDate!).toLocaleDateString()}
                  {isOverdue && <span className="text-red-400"> (Overdue)</span>}
                  {daysUntilDue !== null && daysUntilDue > 0 && !isOverdue && (
                    <span className="text-amber-400">({daysUntilDue}d left)</span>
                  )}
                </span>
              )}
              {task.estimatedHours && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {task.estimatedHours}h est.
                </span>
              )}
            </div>

            {task.aiInsights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {task.aiInsights.slice(0, 2).map((insight) => (
                  <Badge key={insight.id} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-300">
                    <span className="mr-1">💡</span>
                    {insight.title}
                  </Badge>
                ))}
                {task.aiInsights.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{task.aiInsights.length - 2} more insights
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(task as any)} className="h-8 w-8">
              ✏️
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-red-400 hover:text-red-300">
              🗑️
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskList({ tasks, onEdit, onDelete }: { tasks: any[]; onEdit: (t: any) => void; onDelete: (id: string) => void }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-slate-400">No tasks yet</p>
        <p className="text-sm text-slate-500 mt-1">Create your first task to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}