"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Doc } from "@/convex/_generated/dataModel";

interface LeadCardProps {
  lead: Doc<"leads">;
  onClick?: () => void;
  currency?: string;
}

export default function LeadCard({ lead, onClick, currency = "$" }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const daysInStage = Math.floor(
    (Date.now() - lead.stageChangedAt) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-stone-300 dark:hover:border-stone-700 transition-colors ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={onClick}
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
