"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface LeadModalProps {
  lead: Doc<"leads">;
  stages: Doc<"stages">[];
  onClose: () => void;
  currency?: string;
}

export default function LeadModal({ lead, stages, onClose, currency = "$" }: LeadModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [formData, setFormData] = useState({
    name: lead.name,
    company: lead.company ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    website: lead.website ?? "",
    value: lead.value?.toString() ?? "",
    tags: lead.tags.join(", "),
  });

  const updateLead = useMutation(api.leads.updateLead);
  const moveLead = useMutation(api.leads.moveLead);
  const deleteLead = useMutation(api.leads.deleteLead);
  const addNote = useMutation(api.notes.addNote);
  const createTask = useMutation(api.tasks.createTask);
  const cycleTaskStatus = useMutation(api.tasks.cycleTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const notes = useQuery(api.notes.getNotesForLead, { leadId: lead._id });
  const activities = useQuery(api.notes.getActivitiesForLead, {
    leadId: lead._id,
  });
  const tasks = useQuery(api.tasks.getTasksForLead, { leadId: lead._id });

  const daysInStage = Math.floor(
    (Date.now() - lead.stageChangedAt) / (1000 * 60 * 60 * 24)
  );

  const handleSave = async () => {
    await updateLead({
      leadId: lead._id,
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      value: formData.value ? Number(formData.value) : undefined,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleStageChange = async (stageId: Id<"stages">) => {
    await moveLead({ leadId: lead._id, toStageId: stageId });
  };

  const handleDelete = async () => {
    if (confirm("Delete this lead? This action cannot be undone.")) {
      await deleteLead({ leadId: lead._id });
      onClose();
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote({ leadId: lead._id, body: noteText });
    setNoteText("");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask({
      workspaceId: lead.workspaceId,
      leadId: lead._id,
      title: newTaskTitle,
      priority: "medium",
      dueDate: newTaskDue ? new Date(newTaskDue).getTime() : undefined,
    });
    setNewTaskTitle("");
    setNewTaskDue("");
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

  const formatRelative = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-stone-900/20"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg h-full bg-white dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-6 py-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="font-serif text-xl bg-transparent border-b border-stone-300 dark:border-stone-600 focus:outline-none focus:border-stone-900 dark:focus:border-white w-full"
                  autoFocus
                />
              ) : (
                <h2 className="font-serif text-xl truncate">{lead.name}</h2>
              )}
              {!isEditing && lead.company && (
                <p className="text-sm text-stone-500 mt-1">{lead.company}</p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-white ml-4"
            >
              Close
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-stone-500 hover:text-stone-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-stone-500 hover:text-stone-900 dark:hover:text-white"
                >
                  Edit
                </button>
                <span className="text-stone-300">·</span>
                <button
                  onClick={handleDelete}
                  className="text-stone-500 hover:text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stage */}
          <section className="px-6 py-5 border-b border-stone-200 dark:border-stone-800">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">
              Stage · {daysInStage}d
            </p>
            <div className="flex flex-wrap gap-2">
              {stages.map((stage) => (
                <button
                  key={stage._id}
                  onClick={() => handleStageChange(stage._id)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    stage._id === lead.stageId
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          </section>

          {/* Details */}
          <section className="px-6 py-5 border-b border-stone-200 dark:border-stone-800">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">
              Details
            </p>

            {isEditing ? (
              <div className="space-y-3">
                {[
                  { key: "company", label: "Company", type: "text" },
                  { key: "email", label: "Email", type: "email" },
                  { key: "phone", label: "Phone", type: "tel" },
                  { key: "website", label: "Website", type: "url" },
                  { key: "value", label: "Value", type: "number" },
                  { key: "tags", label: "Tags", type: "text" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-stone-500 block mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder={field.label}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none focus:border-stone-400"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                {lead.email && (
                  <div className="flex">
                    <dt className="w-20 text-stone-400 flex-shrink-0">Email</dt>
                    <dd>
                      <a href={`mailto:${lead.email}`} className="hover:underline">
                        {lead.email}
                      </a>
                    </dd>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex">
                    <dt className="w-20 text-stone-400 flex-shrink-0">Phone</dt>
                    <dd>{lead.phone}</dd>
                  </div>
                )}
                {lead.website && (
                  <div className="flex">
                    <dt className="w-20 text-stone-400 flex-shrink-0">Website</dt>
                    <dd>
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                )}
                {lead.value !== undefined && lead.value !== null && (
                  <div className="flex">
                    <dt className="w-20 text-stone-400 flex-shrink-0">Value</dt>
                    <dd className="font-medium">{currency}{lead.value.toLocaleString()}</dd>
                  </div>
                )}
                {lead.tags.length > 0 && (
                  <div className="flex">
                    <dt className="w-20 text-stone-400 flex-shrink-0">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {lead.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          {/* Tasks */}
          <section className="px-6 py-5 border-b border-stone-200 dark:border-stone-800">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">
              Tasks
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none focus:border-stone-400"
              />
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="px-2 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none focus:border-stone-400 w-32"
              />
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="px-3 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm disabled:opacity-30"
              >
                Add
              </button>
            </div>

            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const isDone = task.status === "done";
                  const isInProgress = task.status === "in_progress";
                  return (
                    <div
                      key={task._id}
                      className="flex items-center gap-3 py-2 group"
                    >
                      <button
                        onClick={() => cycleTaskStatus({ taskId: task._id })}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          isDone
                            ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white"
                            : isInProgress
                              ? "bg-amber-500 border-amber-500"
                              : "border-stone-300 dark:border-stone-600 hover:border-stone-400"
                        }`}
                      >
                        {isDone && (
                          <svg className="w-2.5 h-2.5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isInProgress && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          isDone ? "line-through text-stone-400" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.priority === "high" && !isDone && (
                        <span className="text-[10px] text-red-500 uppercase tracking-wider">
                          High
                        </span>
                      )}
                      {task.dueDate && !isDone && (
                        <span
                          className={`text-xs ${
                            task.dueDate < Date.now()
                              ? "text-red-500"
                              : "text-stone-400"
                          }`}
                        >
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                      <button
                        onClick={() => deleteTask({ taskId: task._id })}
                        className="text-xs text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No tasks</p>
            )}
          </section>

          {/* Notes */}
          <section className="px-6 py-5 border-b border-stone-200 dark:border-stone-800">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">
              Notes
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-3 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm disabled:opacity-30"
              >
                Add
              </button>
            </div>

            {notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note._id} className="text-sm">
                    <p className="mb-1">{note.body}</p>
                    <p className="text-xs text-stone-400">
                      {note.authorName ?? "You"} · {formatRelative(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No notes yet</p>
            )}
          </section>

          {/* Activity */}
          <section className="px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">
              Activity
            </p>

            {activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity._id} className="text-sm flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0" />
                    <div>
                      <p>
                        {activity.type === "created" && "Lead created"}
                        {activity.type === "stage_changed" &&
                          `Moved to ${activity.data?.toStageName}`}
                        {activity.type === "note_added" && "Note added"}
                        {activity.type === "value_changed" &&
                          `Value updated to $${activity.data?.toValue}`}
                      </p>
                      <p className="text-xs text-stone-400">
                        {formatRelative(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No activity</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
