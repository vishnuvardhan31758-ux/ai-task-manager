# AI Task Manager

AI-powered task and project management application built with Next.js, Prisma, and OpenAI. The app is designed to help users organize projects, track tasks, and receive AI-generated productivity insights such as prioritization, effort estimation, task breakdowns, and smart scheduling suggestions.

## Overview

This project combines a modern full-stack web app with a task management workflow and intelligent automation. It is structured as a Next.js application using the App Router, with Prisma as the ORM and SQLite as the local development database.

The repository already includes the core building blocks for a real product:
- Task creation and management
- Project organization
- Priority and status tracking
- AI-driven task analysis
- Smart scheduling recommendations
- Task dependencies and subtasks
- Tags, comments, and time tracking
- Notifications and user preferences

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- SQLite (development database)
- OpenAI API
- Tailwind CSS

## Key Features

### Project Management
- Create and manage projects
- Assign tasks to projects
- Organize work by owner and updated status

### Task Workflow
- Create tasks with title, description, priority, status, due dates, and estimates
- Support subtasks and task dependencies
- Use tags, comments, and time tracking

### AI Insights
- Analyze task complexity and generate suggested priorities
- Estimate effort in hours
- Suggest breakdowns and tags
- Identify deadline risks
- Recommend scheduling windows based on work hours and task urgency

### Data Layer
- Prisma schema defines users, projects, tasks, AI insights, notifications, preferences, tags, and time entries
- SQLite database is used for local development setup

## Repository Structure

```bash
.
├── prisma/
│   ├── schema.prisma
│   └── dev.db
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   │   ├── ai-service.ts
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   └── types/
│       └── index.ts
├── .gitignore
├── AGENTS.md
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── package-lock.json
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file by copying the example:

```bash
cp .env.example .env.local
```

Then update the values:

```env
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY="your_openai_api_key"
AI_MODEL="gpt-4o-mini"
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Push the Prisma schema to SQLite

```bash
npx prisma db push
```

### 5. Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite database connection string |
| `OPENAI_API_KEY` | API key used for AI-based task analysis |
| `AI_MODEL` | OpenAI model name, defaults to `gpt-4o-mini` |

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

## AI Functionality

The app includes an AI service layer in `src/lib/ai-service.ts`. It generates insights such as:
- priority suggestions
- time estimates
- task breakdowns
- smart tagging
- deadline risk warnings
- schedule recommendations

This logic uses the OpenAI API and falls back to safe default values if the AI request fails.

## Notes

- The project is currently configured for SQLite for local development.
- Database models are defined in `prisma/schema.prisma` and represent a fairly complete task management domain.
- The frontend is still in an early scaffolded state, but the backend and Prisma models already show the intended product architecture.

## Why this project matters

This repository is not just a basic starter app—it is structured like a real productivity SaaS product. It includes the domain model, backend APIs, AI integration, and task workflow needed for a task manager with intelligent planning features.

In short, the app is meant to help users manage tasks smarter, not just store them. The AI layer adds a practical business value beyond ordinary task tracking by helping with prioritization, planning, and workload management.
