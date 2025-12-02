"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

const LIST_COLORS = [
  { name: "Stone", value: "stone" },
  { name: "Red", value: "red" },
  { name: "Orange", value: "orange" },
  { name: "Amber", value: "amber" },
  { name: "Emerald", value: "emerald" },
  { name: "Blue", value: "blue" },
  { name: "Violet", value: "violet" },
  { name: "Pink", value: "pink" },
];

const colorClasses: Record<string, string> = {
  stone: "bg-stone-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};

export default function ListsPage() {
  const [showNewList, setShowNewList] = useState(false);
  const [selectedListId, setSelectedListId] = useState<Id<"lists"> | null>(null);
  const [editingList, setEditingList] = useState<Id<"lists"> | null>(null);
  
  // Form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("stone");
  
  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("stone");

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const lists = useQuery(
    api.lists.getListsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const selectedList = useQuery(
    api.lists.getListById,
    selectedListId ? { listId: selectedListId } : "skip"
  );

  const createList = useMutation(api.lists.createList);
  const updateList = useMutation(api.lists.updateList);
  const deleteList = useMutation(api.lists.deleteList);
  const removeLeadFromList = useMutation(api.lists.removeLeadFromList);

  if (!workspace) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const currency = workspace.settings?.currency || "$";

  const handleCreateList = async () => {
    if (!newName.trim()) return;
    const listId = await createList({
      workspaceId: workspace._id,
      name: newName,
      description: newDescription || undefined,
      color: newColor,
    });
    setNewName("");
    setNewDescription("");
    setNewColor("stone");
    setShowNewList(false);
    setSelectedListId(listId);
  };

  const handleUpdateList = async () => {
    if (!editingList || !editName.trim()) return;
    await updateList({
      listId: editingList,
      name: editName,
      description: editDescription || undefined,
      color: editColor,
    });
    setEditingList(null);
  };

  const handleDeleteList = async (listId: Id<"lists">) => {
    if (confirm("Delete this list? Leads and tasks will be preserved but unassigned.")) {
      await deleteList({ listId });
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
    }
  };

  const startEditing = (list: { _id: Id<"lists">; name: string; description?: string; color?: string }) => {
    setEditingList(list._id);
    setEditName(list.name);
    setEditDescription(list.description || "");
    setEditColor(list.color || "stone");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left sidebar - List of lists */}
      <div className="w-72 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        <header className="px-6 py-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
                Lists
              </p>
              <h1 className="font-serif text-xl tracking-tight">
                {lists?.length || 0} lists
              </h1>
            </div>
            <button
              onClick={() => setShowNewList(true)}
              className="px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-xs hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
            >
              New
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-3">
          {lists && lists.length > 0 ? (
            <div className="space-y-1">
              {lists.map((list) => (
                <button
                  key={list._id}
                  onClick={() => setSelectedListId(list._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedListId === list._id
                      ? "bg-stone-100 dark:bg-stone-900"
                      : "hover:bg-stone-50 dark:hover:bg-stone-900/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colorClasses[list.color || "stone"]}`} />
                    <span className="font-medium text-sm truncate flex-1">{list.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                    <span>{list.leadCount} leads</span>
                    <span>·</span>
                    <span>{list.taskCount} tasks</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-stone-400 mb-3">No lists yet</p>
              <button
                onClick={() => setShowNewList(true)}
                className="text-sm text-stone-900 dark:text-white underline"
              >
                Create your first list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content - Selected list details */}
      <div className="flex-1">
        {selectedList ? (
          <div>
            <header className="px-8 py-6 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorClasses[selectedList.color || "stone"]}`} />
                  {editingList === selectedList._id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="font-serif text-2xl bg-transparent border-b border-stone-300 focus:outline-none focus:border-stone-500"
                      autoFocus
                    />
                  ) : (
                    <h1 className="font-serif text-2xl tracking-tight">{selectedList.name}</h1>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingList === selectedList._id ? (
                    <>
                      <button
                        onClick={() => setEditingList(null)}
                        className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateList}
                        className="px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-xs"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(selectedList)}
                        className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteList(selectedList._id)}
                        className="px-3 py-1.5 text-xs text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {selectedList.description && !editingList && (
                <p className="text-sm text-stone-500 mt-2 ml-6">{selectedList.description}</p>
              )}
              {editingList === selectedList._id && (
                <div className="mt-4 ml-6 space-y-3">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full max-w-md px-3 py-2 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Color:</span>
                    {LIST_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setEditColor(c.value)}
                        className={`w-5 h-5 rounded-full ${colorClasses[c.value]} ${
                          editColor === c.value ? "ring-2 ring-offset-2 ring-stone-400" : ""
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </header>

            <div className="p-8">
              {/* Leads Section */}
              <div className="mb-10">
                <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4">
                  Leads ({selectedList.leads.length})
                </h2>
                {selectedList.leads.length > 0 ? (
                  <div className="space-y-2">
                    {selectedList.leads.map((lead) => (
                      <div
                        key={lead._id}
                        className="flex items-center justify-between p-3 border border-stone-200 dark:border-stone-800 rounded-lg group"
                      >
                        <Link
                          href={`/leads?open=${lead._id}`}
                          className="flex-1 hover:text-stone-600 dark:hover:text-stone-300"
                        >
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-stone-500">
                            {lead.company && <span>{lead.company} · </span>}
                            <span>{lead.stage?.name || "Unknown stage"}</span>
                            {lead.value && <span> · {currency}{lead.value.toLocaleString()}</span>}
                          </div>
                        </Link>
                        <button
                          onClick={() => removeLeadFromList({ leadId: lead._id })}
                          className="text-xs text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">
                    No leads in this list. Add leads from the New Lead modal or Leads page.
                  </p>
                )}
              </div>

              {/* Tasks Section */}
              <div>
                <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4">
                  Tasks ({selectedList.tasks.length})
                </h2>
                {selectedList.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedList.tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            task.status === "done"
                              ? "bg-emerald-500"
                              : task.status === "in_progress"
                                ? "bg-amber-500"
                                : "bg-stone-300"
                          }`}
                        />
                        <span className={task.status === "done" ? "line-through text-stone-400" : ""}>
                          {task.title}
                        </span>
                        {task.priority === "high" && (
                          <span className="text-[10px] uppercase tracking-wider text-red-500">High</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">
                    No tasks in this list. Add tasks from the Tasks page.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400">
            Select a list to view details
          </div>
        )}
      </div>

      {/* New List Modal */}
      {showNewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/20" onClick={() => setShowNewList(false)} />

          <div className="relative w-full max-w-md bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl">
            <header className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="font-serif text-lg">New list</h2>
              <button
                onClick={() => setShowNewList(false)}
                className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="List name"
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {LIST_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewColor(c.value)}
                      className={`w-6 h-6 rounded-full ${colorClasses[c.value]} ${
                        newColor === c.value ? "ring-2 ring-offset-2 ring-stone-400" : ""
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={handleCreateList}
                disabled={!newName.trim()}
                className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-sm hover:bg-stone-800 dark:hover:bg-stone-100 disabled:opacity-30 transition-colors"
              >
                Create list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
