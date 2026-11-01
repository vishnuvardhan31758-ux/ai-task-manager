import { z } from 'zod'

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  parentTaskId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  tags: z.array(z.string()).optional(),
  dependsOnIds: z.array(z.string()).optional(),
})

export const taskUpdateSchema = taskCreateSchema.partial()

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
})

export const projectUpdateSchema = projectCreateSchema.partial()

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  aiAutoPrioritize: z.boolean().optional(),
  aiSmartScheduling: z.boolean().optional(),
  aiTaskBreakdown: z.boolean().optional(),
  notificationEmail: z.boolean().optional(),
  notificationPush: z.boolean().optional(),
  workHoursStart: z.number().min(0).max(23).optional(),
  workHoursEnd: z.number().min(0).max(23).optional(),
  timezone: z.string().optional(),
})

export const aiInsightActionSchema = z.object({
  insightId: z.string(),
  action: z.enum(['apply', 'dismiss']),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>
export type AIInsightActionInput = z.infer<typeof aiInsightActionSchema>