"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  _count?: { tasks: number };
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  project?: { id: string; name: string; color?: string | null } | null;
};

const statusColors: Record<string, string> = {
  TODO: "bg-slate-700 text-slate-200",
  IN_PROGRESS: "bg-blue-600 text-blue-50",
  IN_REVIEW: "bg-amber-600 text-amber-50",
  DONE: "bg-emerald-600 text-emerald-50",
  ARCHIVED: "bg-slate-600 text-slate-100",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-emerald-500/15 text-emerald-300",
  MEDIUM: "bg-yellow-500/15 text-yellow-300",
  HIGH: "bg-orange-500/15 text-orange-300",
  URGENT: "bg-red-500/15 text-red-300",
};

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
      ]);

      if (!projectsRes.ok || !tasksRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const [projectsData, tasksData] = await Promise.all([
        projectsRes.json(),
        tasksRes.json(),
      ]);

      setProjects(projectsData);
      setTasks(tasksData);
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      openTasks: tasks.filter((task) => task.status !== "DONE").length,
      completed: tasks.filter((task) => task.status === "DONE").length,
    };
  }, [projects, tasks]);

  const createProject = async () => {
    const name = projectName.trim();
    if (!name) return;

    try {
      setCreatingProject(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: projectDescription,
          color: "#3B82F6",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjectName("");
      setProjectDescription("");
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingProject(false);
    }
  };

  const createTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    try {
      setCreatingTask(true);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: taskDescription,
          projectId: selectedProjectId || undefined,
          status: "TODO",
          priority: "MEDIUM",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      setTaskTitle("");
      setTaskDescription("");
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">AI Task Manager</p>
          <h1 className="mt-4 text-3xl font-bold">Loading dashboard…</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">AI Task Manager</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">MVP dashboard</h1>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-cyan-500 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            Refresh data
          </button>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Projects</p>
            <p className="mt-2 text-3xl font-bold">{projectStats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Open tasks</p>
            <p className="mt-2 text-3xl font-bold">{projectStats.openTasks}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-bold">{projectStats.completed}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <span className="text-sm text-slate-400">{tasks.length} total</span>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center text-slate-400">
                  No tasks yet. Add one from the form.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {task.project?.name || "No project"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[task.status] || "bg-slate-600 text-slate-100"}`}>
                        {task.status}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[task.priority] || "bg-slate-600 text-slate-100"}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 text-xl font-semibold">Create project</h2>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project name"
                className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500"
              />
              <textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Description"
                rows={3}
                className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => void createProject()}
                disabled={creatingProject || !projectName.trim()}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingProject ? "Creating…" : "Create project"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 text-xl font-semibold">Create task</h2>
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Task title"
                className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Task description"
                rows={3}
                className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
              />
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void createTask()}
                disabled={creatingTask || !taskTitle.trim()}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingTask ? "Creating…" : "Create task"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
