"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableStageItem({
  stage,
  onRename,
  onDelete,
  canDelete,
}: {
  stage: Doc<"stages">;
  onRename: (name: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stage.name);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stage._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editName.trim() && editName !== stage.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 py-3 border-b border-stone-100 dark:border-stone-900"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing"
      >
        ⋮⋮
      </button>

      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          stage.isWon ? "bg-emerald-500" : stage.isLost ? "bg-stone-300" : "bg-stone-400"
        }`}
      />

      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
          onBlur={handleSave}
          className="flex-1 px-2 py-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-pointer hover:text-stone-500"
          onClick={() => setIsEditing(true)}
        >
          {stage.name}
        </span>
      )}

      {stage.isWon && <span className="text-xs text-emerald-600">Won</span>}
      {stage.isLost && <span className="text-xs text-stone-400">Lost</span>}

      {canDelete && !isEditing && (
        <button
          onClick={onDelete}
          className="text-xs text-stone-400 hover:text-red-600"
        >
          Remove
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "workspace" | "usage">("pipeline");
  const [newStageName, setNewStageName] = useState("");
  const [deleteStageId, setDeleteStageId] = useState<Id<"stages"> | null>(null);
  const [reassignStageId, setReassignStageId] = useState<Id<"stages"> | null>(null);

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const pipelineData = useQuery(
    api.pipelines.getPipelineWithStages,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const usage = useQuery(
    api.workspaces.getUsage,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const createStage = useMutation(api.pipelines.createStage);
  const updateStage = useMutation(api.pipelines.updateStage);
  const deleteStage = useMutation(api.pipelines.deleteStage);
  const reorderStages = useMutation(api.pipelines.reorderStages);
  const updateWorkspace = useMutation(api.workspaces.updateWorkspaceSettings);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (!workspace || !pipelineData) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const stages = pipelineData.stages;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s._id === active.id);
    const newIndex = stages.findIndex((s) => s._id === over.id);

    const newOrder = arrayMove(
      stages.map((s) => s._id),
      oldIndex,
      newIndex
    );

    await reorderStages({
      pipelineId: pipelineData._id,
      stageOrder: newOrder,
    });
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;

    await createStage({
      pipelineId: pipelineData._id,
      name: newStageName.trim(),
    });
    setNewStageName("");
  };

  const handleDeleteStage = async () => {
    if (!deleteStageId || !reassignStageId) return;

    await deleteStage({
      stageId: deleteStageId,
      reassignToStageId: reassignStageId,
    });
    setDeleteStageId(null);
    setReassignStageId(null);
  };

  return (
    <div className="min-h-screen">
      <header className="px-12 pt-12 pb-8 border-b border-stone-200 dark:border-stone-800">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
          Settings
        </p>
        <h1 className="font-serif text-3xl tracking-tight">Configuration</h1>
      </header>

      <div className="flex">
        {/* Tabs */}
        <nav className="w-48 px-8 py-8 border-r border-stone-200 dark:border-stone-800">
          {[
            { id: "pipeline", label: "Pipeline" },
            { id: "workspace", label: "Workspace" },
            { id: "usage", label: "Usage" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                activeTab === tab.id
                  ? "text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 px-12 py-8 max-w-2xl">
          {/* Pipeline */}
          {activeTab === "pipeline" && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-6">
                Pipeline stages
              </h2>
              <p className="text-sm text-stone-500 mb-6">
                Drag to reorder. Click name to rename.
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map((s) => s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mb-6">
                    {stages.map((stage) => (
                      <SortableStageItem
                        key={stage._id}
                        stage={stage}
                        onRename={(name) => updateStage({ stageId: stage._id, name })}
                        onDelete={() => {
                          setDeleteStageId(stage._id);
                          const other = stages.find((s) => s._id !== stage._id);
                          setReassignStageId(other?._id ?? null);
                        }}
                        canDelete={stages.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {stages.length < (usage?.limits.MAX_STAGES ?? 10) && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New stage name"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                    className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleAddStage}
                    disabled={!newStageName.trim()}
                    className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded text-sm disabled:opacity-30"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Workspace */}
          {activeTab === "workspace" && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-6">
                Workspace
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={workspace.name}
                    onBlur={(e) => {
                      if (e.target.value !== workspace.name) {
                        updateWorkspace({
                          workspaceId: workspace._id,
                          name: e.target.value,
                        });
                      }
                    }}
                    className="w-full max-w-sm px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 block mb-2">
                    Currency
                  </label>
                  <select
                    defaultValue={workspace.settings?.currency || "$"}
                    onChange={(e) => {
                      updateWorkspace({
                        workspaceId: workspace._id,
                        settings: {
                          ...workspace.settings,
                          currency: e.target.value,
                        },
                      });
                    }}
                    className="w-full max-w-sm px-3 py-2.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                  >
                    <option value="$">$ USD - US Dollar</option>
                    <option value="£">£ GBP - British Pound</option>
                    <option value="€">€ EUR - Euro</option>
                    <option value="¥">¥ JPY - Japanese Yen</option>
                    <option value="A$">A$ AUD - Australian Dollar</option>
                    <option value="C$">C$ CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="₹">₹ INR - Indian Rupee</option>
                    <option value="R$">R$ BRL - Brazilian Real</option>
                    <option value="kr">kr SEK - Swedish Krona</option>
                  </select>
                  <p className="text-xs text-stone-400 mt-2">
                    Used for displaying lead values
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Usage */}
          {activeTab === "usage" && usage && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-6">
                Current usage
              </h2>

              <div className="space-y-6">
                {[
                  { label: "Leads", current: usage.usage?.leadCount ?? 0, max: usage.limits.MAX_LEADS },
                  { label: "Pipelines", current: 1, max: usage.limits.MAX_PIPELINES },
                  { label: "Stages", current: stages.length, max: usage.limits.MAX_STAGES },
                  { label: "Daily imports", current: usage.usage?.importsToday ?? 0, max: usage.limits.MAX_IMPORTS_PER_DAY },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-stone-500">{item.label}</span>
                      <span>{item.current} / {item.max}</span>
                    </div>
                    <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-400 rounded-full"
                        style={{ width: `${(item.current / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <p className="text-sm text-stone-500">
                  You&apos;re on the free plan. Need higher limits? Upgrade options coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Stage Modal */}
      {deleteStageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/20"
            onClick={() => setDeleteStageId(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <h3 className="font-medium mb-4">Delete stage</h3>
            <p className="text-sm text-stone-500 mb-4">
              Move existing leads to:
            </p>

            <select
              value={reassignStageId ?? ""}
              onChange={(e) => setReassignStageId(e.target.value as Id<"stages">)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-sm mb-6 focus:outline-none"
            >
              {stages
                .filter((s) => s._id !== deleteStageId)
                .map((stage) => (
                  <option key={stage._id} value={stage._id}>
                    {stage.name}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteStageId(null)}
                className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStage}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
