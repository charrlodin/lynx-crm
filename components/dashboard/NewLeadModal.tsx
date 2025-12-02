"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface NewLeadModalProps {
  workspaceId: Id<"workspaces">;
  pipelineId: Id<"pipelines">;
  stages: Doc<"stages">[];
  defaultStageId?: Id<"stages">;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewLeadModal({
  workspaceId,
  pipelineId,
  stages,
  defaultStageId,
  onClose,
  onSuccess,
}: NewLeadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    value: "",
    tags: "",
    stageId: defaultStageId || stages[0]?._id || "",
    listId: "" as Id<"lists"> | "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const lists = useQuery(api.lists.getListsForWorkspace, { workspaceId });
  const createLead = useMutation(api.leads.createLead);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.stageId) {
      setError("Please select a stage");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createLead({
        workspaceId,
        pipelineId,
        stageId: formData.stageId as Id<"stages">,
        listId: formData.listId || undefined,
        name: formData.name,
        company: formData.company || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        value: formData.value ? Number(formData.value) : undefined,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/20" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl">
        <header className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h2 className="font-serif text-lg">New lead</h2>
          <button
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-white"
          >
            Cancel
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Contact name"
                className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                Stage *
              </label>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <button
                    key={stage._id}
                    type="button"
                    onClick={() => setFormData({ ...formData, stageId: stage._id })}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      formData.stageId === stage._id
                        ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white"
                        : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400"
                    }`}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            </div>

            {lists && lists.length > 0 && (
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  List
                </label>
                <select
                  value={formData.listId}
                  onChange={(e) =>
                    setFormData({ ...formData, listId: e.target.value as Id<"lists"> })
                  }
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

            <div>
              <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Company name"
                className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 555 000 0000"
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Value
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="10000"
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="enterprise, saas"
                  className="w-full px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-sm hover:bg-stone-800 dark:hover:bg-stone-100 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
