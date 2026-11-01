import { PrismaClient, Task, Project, AIInsight, AIInsightType, Priority, TaskStatus } from '@prisma/client'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIInsightResult {
  type: AIInsightType
  title: string
  description: string
  confidence: number
  metadata?: Record<string, unknown>
}

export interface TaskAnalysis {
  priority?: Priority
  estimatedHours?: number
  suggestedSubtasks?: string[]
  suggestedTags?: string[]
  deadlineRisk?: boolean
  suggestedSchedule?: { startDate: Date; endDate: Date }
  breakdown?: string[]
}

export class AIService {
  private model: string

  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-4o-mini'
  }

  async analyzeTask(task: Task, project?: Project | null): Promise<TaskAnalysis> {
    const prompt = this.buildTaskAnalysisPrompt(task, project)
    
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an AI productivity assistant specializing in task management. 
            Analyze tasks and provide actionable insights. Return ONLY valid JSON.
            Be concise and practical. Focus on actionable insights.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return this.validateAnalysis(result)
    } catch (error) {
      console.error('AI Analysis Error:', error)
      return this.getDefaultAnalysis()
    }
  }

  async generateInsights(task: Task, project?: Project | null): Promise<AIInsightResult[]> {
    const analysis = await this.analyzeTask(task, project)
    const insights: AIInsightResult[] = []

    // Priority suggestion
    if (analysis.priority && analysis.priority !== 'MEDIUM') {
      insights.push({
        type: 'PRIORITY_SUGGESTION',
        title: `Priority Adjustment: ${analysis.priority}`,
        description: `Based on task complexity and context, consider setting priority to ${analysis.priority}`,
        confidence: 0.85,
        metadata: { suggestedPriority: analysis.priority }
      })
    }

    // Time estimation
    if (analysis.estimatedHours) {
      insights.push({
        type: 'TIME_ESTIMATION',
        title: `Estimated Effort: ${analysis.estimatedHours} hours`,
        description: `AI estimates this task will take approximately ${analysis.estimatedHours} hours to complete`,
        confidence: 0.75,
        metadata: { estimatedHours: analysis.estimatedHours }
      })
    }

    // Task breakdown
    if (analysis.suggestedSubtasks && analysis.suggestedSubtasks.length > 0) {
      insights.push({
        type: 'TASK_BREAKDOWN',
        title: 'Task Breakdown Suggestion',
        description: `Consider breaking this task into ${analysis.suggestedSubtasks.length} subtasks`,
        confidence: 0.8,
        metadata: { subtasks: analysis.suggestedSubtasks }
      })
    }

    // Deadline risk
    if (analysis.deadlineRisk) {
      insights.push({
        type: 'DEADLINE_RISK',
        title: '⚠️ Deadline Risk Detected',
        description: 'This task may not be completed by its deadline based on current progress and complexity',
        confidence: 0.9,
        metadata: { riskLevel: 'high' }
      })
    }

    // Smart scheduling
    if (analysis.suggestedSchedule) {
      insights.push({
        type: 'SMART_SCHEDULING',
        title: 'Optimal Schedule Window',
        description: `Best time to work on this: ${analysis.suggestedSchedule.startDate.toLocaleDateString()} - ${analysis.suggestedSchedule.endDate.toLocaleDateString()}`,
        confidence: 0.7,
        metadata: analysis.suggestedSchedule
      })
    }

    // Smart tags
    if (analysis.suggestedTags && analysis.suggestedTags.length > 0) {
      insights.push({
        type: 'SMART_TAGGING',
        title: 'Suggested Tags',
        description: `Consider adding tags: ${analysis.suggestedTags.join(', ')}`,
        confidence: 0.75,
        metadata: { tags: analysis.suggestedTags }
      })
    }

    return insights
  }

  async generateTaskBreakdown(task: Task): Promise<string[]> {
    const prompt = `Break down this task into 3-5 clear, actionable subtasks:
    
    Task: ${task.title}
    Description: ${task.description || 'No description'}
    Priority: ${task.priority}
    Status: ${task.status}
    
    Return ONLY a JSON array of subtask titles.`

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Return only a JSON array of strings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(response.choices[0].message.content || '{"subtasks": []}')
      return result.subtasks || []
    } catch {
      return []
    }
  }

  async suggestOptimalSchedule(task: Task, userWorkHours?: { start: number; end: number }): Promise<{ startDate: Date; endDate: Date } | null> {
    const workStart = userWorkHours?.start || 9
    const workEnd = userWorkHours?.end || 17
    
    if (!task.dueDate) return null

    const now = new Date()
    const dueDate = new Date(task.dueDate)
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const workHoursPerDay = workEnd - workStart
    const daysNeeded = Math.ceil((task.estimatedHours || 4) / workHoursPerDay)
    
    const startDate = new Date()
    startDate.setHours(workStart, 0, 0, 0)
    if (startDate < now) startDate.setDate(startDate.getDate() + 1)
    
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + daysNeeded)
    
    return { startDate, endDate }
  }

  async generateDailySummary(tasks: Task[], userPreferences?: any): Promise<string> {
    const today = new Date()
    const todayTasks = tasks.filter(t => 
      t.dueDate && t.dueDate.toDateString() === today.toDateString()
    )
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < today && t.status !== 'DONE'
    )
    const highPriority = tasks.filter(t => 
      t.priority === 'HIGH' || t.priority === 'URGENT'
    ).slice(0, 3)

    const prompt = `Generate a concise daily productivity summary for a developer:
    
    Today's Tasks: ${todayTasks.length}
    Overdue Tasks: ${overdueTasks.length}
    High Priority: ${highPriority.length}
    Total Active: ${tasks.filter(t => t.status !== 'DONE' && t.status !== 'ARCHIVED').length}
    
    Top priorities: ${highPriority.map(t => t.title).join(', ') || 'None'}
    
    Write a 2-3 sentence motivational summary with actionable advice.`

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a supportive productivity coach. Be encouraging but practical.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
      
      return response.choices[0].message.content || 'Ready to tackle today\'s challenges!'
    } catch {
      return 'You\'ve got this! Focus on your top priorities and make steady progress.'
    }
  }

  private buildTaskAnalysisPrompt(task: Task, project?: Project | null): string {
    return `Analyze this task and provide insights:
    
    Task: ${task.title}
    Description: ${task.description || 'No description'}
    Status: ${task.status}
    Priority: ${task.priority}
    Due Date: ${task.dueDate ? task.dueDate.toISOString() : 'No due date'}
    Estimated Hours: ${task.estimatedHours || 'Not set'}
    Actual Hours: ${task.actualHours || 'Not tracked'}
    Project: ${project?.name || 'No project'}
    Project Description: ${project?.description || 'N/A'}
    Subtasks: ${task.subTasks ? task.subTasks.length : 0} (${task.subTasks?.filter(s => s.status === 'DONE').length || 0} done)
    Tags: ${task.tags?.map(t => t.tag.name).join(', ') || 'None'}
    Dependencies: ${task.dependencies ? task.dependencies.length : 0}
    
    Return ONLY valid JSON with these fields:
    {
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "estimatedHours": number,
      "suggestedSubtasks": ["string"],
      "suggestedTags": ["string"],
      "deadlineRisk": boolean,
      "suggestedSchedule": {"startDate": "ISO date", "endDate": "ISO date"},
      "breakdown": ["string"]
    }`
  }

  private validateAnalysis(result: any): TaskAnalysis {
    return {
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(result.priority) ? result.priority : undefined,
      estimatedHours: typeof result.estimatedHours === 'number' && result.estimatedHours > 0 ? result.estimatedHours : undefined,
      suggestedSubtasks: Array.isArray(result.suggestedSubtasks) ? result.suggestedSubtasks.filter((s: any) => typeof s === 'string') : undefined,
      suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags.filter((s: any) => typeof s === 'string') : undefined,
      deadlineRisk: typeof result.deadlineRisk === 'boolean' ? result.deadlineRisk : undefined,
      suggestedSchedule: result.suggestedSchedule ? {
        startDate: new Date(result.suggestedSchedule.startDate),
        endDate: new Date(result.suggestedSchedule.endDate)
      } : undefined,
      breakdown: Array.isArray(result.breakdown) ? result.breakdown.filter((s: any) => typeof s === 'string') : undefined
    }
  }

  private getDefaultAnalysis(): TaskAnalysis {
    return {
      priority: undefined,
      estimatedHours: undefined,
      suggestedSubtasks: undefined,
      suggestedTags: undefined,
      deadlineRisk: undefined,
      suggestedSchedule: undefined,
      breakdown: undefined
    }
  }
}

export const aiService = new AIService()