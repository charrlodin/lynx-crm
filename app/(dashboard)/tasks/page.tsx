"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "done";

export default function TasksPage() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  
  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newLeadId, setNewLeadId] = useState<Id<"leads"> | "">("");
  const [newListId, setNewListId] = useState<Id<"lists"> | "">("");

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const tasks = useQuery(
    api.tasks.getTasksForWorkspace,
    workspace
      ? {
          workspaceId: workspace._id,
          status: filterStatus !== "all" ? filterStatus : undefined,
          priority: filterPriority !== "all" ? filterPriority : undefined,
        }
      : "skip"
  );
  const leads = useQuery(
    api.tasks.getLeadsForTaskAssignment,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const lists = useQuery(
    api.lists.getListsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const tasksSummary = useQuery(
    api.tasks.getTasksSummary,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const createTask = useMutation(api.tasks.createTask);
  const cycleStatus = useMutation(api.tasks.cycleTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);

  if (!workspace) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    await createTask({
      workspaceId: workspace._id,
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority,
      leadId: newLeadId || undefined,
      listId: newListId || undefined,
      dueDate: newDueDate ? new Date(newDueDate).getTime() : undefined,
    });
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewLeadId("");
    setNewListId("");
    setShowNewTask(false);
  };

  const formatDueDate = (ts: number) => {
    const date = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(ts);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() < today.getTime()) {
      return "Overdue";
    }
    if (dateOnly.getTime() === today.getTime()) {
      return "Today";
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const priorityColors = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-stone-400",
  };

  const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-8 py-6 border-b border-stone-200 dark:border-stone-800 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
            Tasks
          </p>
          <h1 className="font-serif text-2xl tracking-tight">
            {tasksSummary ? `${tasksSummary.todo + tasksSummary.inProgress} active` : "Loading..."}
          </h1>
        </div>

        <button
          onClick={() => setShowNewTask(true)}
          className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
        >
          New task
        </button>
      </header>

      {/* Summary Stats */}
      {tasksSummary && (
        <div className="px-8 py-6 border-b border-stone-100 dark:border-stone-900 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl">{tasksSummary.todo}</span>
            <span className="text-sm text-stone-500">To do</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl text-amber-500">{tasksSummary.inProgress}</span>
            <span className="text-sm text-stone-500">In progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl text-emerald-600">{tasksSummary.done}</span>
            <span className="text-sm text-stone-500">Done</span>
          </div>
          {tasksSummary.overdue > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-serif text-2xl text-red-500">{tasksSummary.overdue}</span>
              <span className="text-sm text-stone-500">Overdue</span>
            </div>
          )}
          {tasksSummary.highPriority > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl text-red-500">{tasksSummary.highPriority}</span>
              <span className="text-sm text-stone-500">High priority</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="px-8 py-4 border-b border-stone-100 dark:border-stone-900 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-stone-400">Status</span>
          {(["all", "todo", "in_progress", "done"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filterStatus === status
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white"
                  : "border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-400"
              }`}
            >
              {status === "all" ? "All" : statusLabels[status]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-stone-400">Priority</span>
          {(["all", "high", "medium", "low"] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filterPriority === priority
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white"
                  : "border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-400"
              }`}
            >
              {priority === "all" ? "All" : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="px-8 py-4">
        {tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isDone = task.status === "done";
              const isInProgress = task.status === "in_progress";
              const isOverdue = task.dueDate && task.dueDate < Date.now() && !isDone;

              return (
                <div
                  key={task._id}
                  className={`group flex items-start gap-4 p-4 border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-300 dark:hover:border-stone-700 transition-colors ${
                    isDone ? "opacity-60" : ""
                  }`}
                >
                  {/* Status Toggle */}
                  <button
                    onClick={() => cycleStatus({ taskId: task._id })}
                    className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white"
                        : isInProgress
                          ? "bg-amber-500 border-amber-500"
                          : "border-stone-300 dark:border-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {isDone && (
                      <svg className="w-3 h-3 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isInProgress && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-medium ${isDone ? "line-through text-stone-400" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-stone-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Priority */}
                        <span className={`text-[10px] uppercase tracking-wider ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        
                        {/* Due Date */}
                        {task.dueDate && (
                          <span
                            className={`text-xs ${
                              isOverdue ? "text-red-500 font-medium" : "text-stone-400"
                            }`}
                          >
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask({ taskId: task._id })}
                          className="text-xs text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Lead Link */}
                    {task.lead && (
                      <Link
                        href={`/leads?open=${task.leadId}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                        {task.lead.name}
                        {task.lead.company && ` · ${task.lead.company}`}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-stone-400 mb-4">
              {filterStatus !== "all" || filterPriority !== "all"
                ? "No tasks match your filters"
                : "No tasks yet"}
            </p>
            <button
              onClick={() => setShowNewTask(true)}
              className="text-sm text-stone-900 dark:text-white underline"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/20" onClick={() => setShowNewTask(false)} />

          <div className="relative w-full max-w-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl">
            <header className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="font-serif text-lg">New task</h2>
              <button
                onClick={() => setShowNewTask(false)}
                className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </header>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        newPriority === p
                          ? p === "high"
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600"
                            : p === "medium"
                              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600"
                              : "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                          : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Assignment */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Related Lead
                </label>
                <select
                  value={newLeadId}
                  onChange={(e) => setNewLeadId(e.target.value as Id<"leads">)}
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                >
                  <option value="">No lead</option>
                  {leads?.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {lead.name} {lead.company && `(${lead.company})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* List Assignment */}
              {lists && lists.length > 0 && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                    List
                  </label>
                  <select
                    value={newListId}
                    onChange={(e) => setNewListId(e.target.value as Id<"lists">)}
                    className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                  >
                    <option value="">No list</option>
                    {lists.map((list) => (
                      <option key={list._id} value={list._id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Due Date */}
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={handleCreateTask}
                disabled={!newTitle.trim()}
                className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-sm hover:bg-stone-800 dark:hover:bg-stone-100 disabled:opacity-30 transition-colors"
              >
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
