import { PrismaClient, Task, Project, AIInsight, AIInsightType, Priority, TaskStatus } from '@prisma/client'
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY
const baseURL = process.env.OPENAI_BASE_URL || process.env.NVIDIA_BASE_URL

const openai = new OpenAI({
  apiKey: apiKey || '',
  ...(baseURL ? { baseURL } : {}),
})

export interface AIInsightResult {
  type: AIInsightType
  title: string
  description: string
  confidence: number
  metadata?: Record<string, unknown>
}
