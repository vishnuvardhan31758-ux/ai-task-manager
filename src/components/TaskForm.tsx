'use client'

import { useState, useEffect } from 'react'
import { Task, Project, AIInsight, Priority, TaskStatus } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskCreateSchema, TaskCreateInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from 'lucide-react'

interface TaskFormProps {
  projectId?: string
  onClose: () => void
  onSuccess: () => void
  initialData?: Partial<Task>
}

export function TaskForm({ projectId, onClose, onSuccess, initialData }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      projectId: projectId || initialData?.projectId || '',
      status: initialData?.status || 'TODO',
      priority: initialData?.priority || 'MEDIUM',
      dueDate: initialData?.dueDate?.toISOString().split('T')[0] || '',
      startDate: initialData?.startDate?.toISOString().split('T')[0] || '',
      estimatedHours: initialData?.estimatedHours || undefined,
      tags: [],
      dependsOnIds: [],
      ...initialData,
    },
  })

  const onSubmit = async (data: TaskCreateInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
          estimatedHours: data.estimatedHours || null,
          tags: data.tags || [],
          dependsOnIds: data.dependsOnIds || [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
        <Input
          {...form.register('title')}
          placeholder="Enter task title"
          className="w-full"
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
        <Textarea
          {...form.register('description')}
          placeholder="Describe the task..."
          rows={3}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
          <Select onValueChange={(value) => form.setValue('status', value as any)} defaultValue={form.getValues('status')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">📋 To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">🔄 In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">👀 In Review</SelectItem>
              <SelectItem value="DONE">✅ Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
          <Select onValueChange={(value) => form.setValue('priority', value as any)} defaultValue={form.getValues('priority')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">🟢 Low</SelectItem>
              <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
              <SelectItem value="HIGH">🟠 High</SelectItem>
              <SelectItem value="URGENT">🔴 Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
          <input
            type="date"
            {...form.register('dueDate')}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
          <input
            type="date"
            {...form.register('startDate')}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Estimated Hours</label>
        <Input
          type="number"
          step="0.5"
          min="0"
          {...form.register('estimatedHours', { valueAsNumber: true })}
          placeholder="e.g., 4.5"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma separated)</label>
        <Input
          {...form.register('tags', {
            setValueAs: (value: string) => value.split(',').map(t => t.trim()).filter(Boolean),
          })}
          placeholder="frontend, backend, urgent"
          className="w-full"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}