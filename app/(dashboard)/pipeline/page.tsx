"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import LeadModal from "@/components/dashboard/LeadModal";
import NewLeadModal from "@/components/dashboard/NewLeadModal";

function DraggableLeadCard({
  lead,
  onClick,
  currency,
}: {
  lead: Doc<"leads">;
  onClick: () => void;
  currency: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead._id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const daysInStage = Math.floor(
    (Date.now() - lead.stageChangedAt) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-stone-300 dark:hover:border-stone-700 transition-all ${
        isDragging ? "opacity-50 shadow-lg z-50" : ""
      }`}
      onClick={() => {
        if (!isDragging) onClick();
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-medium text-sm leading-tight">{lead.name}</h4>
        {lead.value !== undefined && lead.value !== null && (
          <span className="text-xs font-medium text-stone-500 whitespace-nowrap">
            {currency}{lead.value.toLocaleString()}
          </span>
        )}
      </div>

      {lead.company && (
        <p className="text-xs text-stone-400 mb-3">{lead.company}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">
          {daysInStage}d in stage
        </span>

        {lead.tags.length > 0 && (
          <div className="flex gap-1">
            {lead.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DroppableStageColumn({
  stage,
  leads,
  onLeadClick,
  currency,
}: {
  stage: Doc<"stages">;
  leads: Doc<"leads">[];
  onLeadClick: (lead: Doc<"leads">) => void;
  currency: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage._id });

  return (
    <div className="w-72 flex-shrink-0 flex flex-col">
      {/* Stage Header */}
      <div className="px-2 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              stage.isWon
                ? "bg-emerald-500"
                : stage.isLost
                  ? "bg-stone-300 dark:bg-stone-600"
                  : "bg-stone-400"
            }`}
          />
          <span className="text-sm font-medium">{stage.name}</span>
        </div>
        <span className="text-xs text-stone-400">{leads.length}</span>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto transition-colors rounded-lg ${
          isOver ? "bg-stone-100/50 dark:bg-stone-800/30" : ""
        }`}
      >
        <div className="space-y-3 py-1">
          {leads.map((lead) => (
            <DraggableLeadCard
              key={lead._id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
              currency={currency}
            />
          ))}
        </div>

        {leads.length === 0 && (
          <div className={`text-center py-12 text-xs text-stone-400 ${isOver ? "text-stone-500" : ""}`}>
            {isOver ? "Drop here" : "No leads"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewLeadModal, setShowNewLeadModal] = useState(
    searchParams.get("new") === "true"
  );
  const [selectedLead, setSelectedLead] = useState<Doc<"leads"> | null>(null);
  const [activeId, setActiveId] = useState<Id<"leads"> | null>(null);

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const pipelineData = useQuery(
    api.pipelines.getPipelineWithStages,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const leads = useQuery(
    api.leads.getLeadsByPipeline,
    pipelineData
      ? { pipelineId: pipelineData._id, search: searchQuery || undefined }
      : "skip"
  );

  const moveLead = useMutation(api.leads.moveLead);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewLeadModal(true);
      window.history.replaceState({}, "", "/pipeline");
    }
  }, [searchParams]);

  if (!workspace || !pipelineData) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const stages = pipelineData.stages;
  const currency = workspace.settings?.currency || "$";
  
  const getLeadsForStage = (stageId: Id<"stages">) =>
    leads?.filter((l) => l.stageId === stageId) ?? [];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"leads">);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as Id<"leads">;
    const lead = leads?.find((l) => l._id === leadId);
    if (!lead) return;

    // The 'over' should be a stage ID
    const targetStageId = over.id as Id<"stages">;
    const targetStage = stages.find((s) => s._id === targetStageId);
    
    if (targetStage && targetStageId !== lead.stageId) {
      await moveLead({ leadId, toStageId: targetStageId });
    }
  };

  const activeLead = activeId ? leads?.find((l) => l._id === activeId) : null;
  const totalLeads = leads?.length ?? 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-stone-200 dark:border-stone-800 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
            Pipeline
          </p>
          <h1 className="font-serif text-2xl tracking-tight">
            {pipelineData.name}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors"
          />
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
          >
            New lead
          </button>
        </div>
      </header>

      {/* Stage summary */}
      <div className="px-8 py-3 border-b border-stone-100 dark:border-stone-900 flex items-center gap-6 text-xs text-stone-400">
        <span>{totalLeads} leads</span>
        <span>·</span>
        {stages.slice(0, 4).map((stage) => (
          <span key={stage._id}>
            {stage.name}: {getLeadsForStage(stage._id).length}
          </span>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {stages.map((stage) => (
              <DroppableStageColumn
                key={stage._id}
                stage={stage}
                leads={getLeadsForStage(stage._id)}
                onLeadClick={setSelectedLead}
                currency={currency}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead && (
              <div className="p-4 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg shadow-xl w-72">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-sm">{activeLead.name}</h4>
                  {activeLead.value !== undefined && (
                    <span className="text-xs font-medium text-stone-500">
                      {currency}{activeLead.value.toLocaleString()}
                    </span>
                  )}
                </div>
                {activeLead.company && (
                  <p className="text-xs text-stone-400">{activeLead.company}</p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      {showNewLeadModal && (
        <NewLeadModal
          workspaceId={workspace._id}
          pipelineId={pipelineData._id}
          stages={stages}
          onClose={() => setShowNewLeadModal(false)}
        />
      )}

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          stages={stages}
          onClose={() => setSelectedLead(null)}
          currency={currency}
        />
      )}
    </div>
  );
}
