import { Task, Project, AIInsight, Priority, TaskStatus } from '@prisma/client'

export interface TaskWithRelations extends Task {
  project: Project | null
  assignee: { id: string; name: string | null; email: string; image: string | null } | null
  tags: { tag: { id: string; name: string; color: string } }[]
  comments: { id: string; content: string; createdAt: Date; author: { id: string; name: string | null; image: string | null } }[]
  aiInsights: AIInsight[]
  subTasks: Task[]
  dependencies: { dependsOn: Task }[]
  dependents: { task: Task }[]
  timeEntries: { id: string; startTime: Date; endTime: Date | null; duration: number | null; user: { id: string; name: string | null } }[]
}

export type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED'
export type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type AIInsightType = 'PRIORITY_SUGGESTION' | 'TASK_BREAKDOWN' | 'SMART_SCHEDULING' | 'TIME_ESTIMATION' | 'PRIORITY_REORDER' | 'DEADLINE_RISK' | 'WORKLOAD_BALANCE' | 'SKILL_GAP' | 'PRODUCTIVITY_PATTERN' | 'SMART_TAGGING'

export interface AIInsightWithTask extends AIInsight {
  task: Task | null
}