"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import LeadModal from "@/components/dashboard/LeadModal";
import NewLeadModal from "@/components/dashboard/NewLeadModal";

type SortField = "name" | "company" | "value" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStage, setFilterStage] = useState<Id<"stages"> | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Doc<"leads"> | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"leads">>>(new Set());

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const pipelineData = useQuery(
    api.pipelines.getPipelineWithStages,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const leads = useQuery(
    api.leads.getLeadsByWorkspace,
    workspace
      ? {
          workspaceId: workspace._id,
          search: searchQuery || undefined,
          stageId: filterStage !== "all" ? filterStage : undefined,
          sortBy,
          sortOrder,
        }
      : "skip"
  );

  const bulkMove = useMutation(api.leads.bulkMoveLeads);
  const bulkDelete = useMutation(api.leads.bulkDeleteLeads);

  if (!workspace || !pipelineData) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const stages = pipelineData.stages;
  const stageMap = new Map(stages.map((s) => [s._id, s]));
  const currency = workspace.settings?.currency || "$";

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const toggleSelect = (id: Id<"leads">) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!leads) return;
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} leads? This cannot be undone.`)) return;
    await bulkDelete({ leadIds: Array.from(selectedIds) });
    setSelectedIds(new Set());
  };

  const exportToCSV = () => {
    if (!leads || leads.length === 0) return;

    const headers = ["Name", "Company", "Email", "Phone", "Value", "Stage", "Tags", "Created"];
    const rows = leads.map((lead) => {
      const stage = stageMap.get(lead.stageId);
      return [
        lead.name,
        lead.company ?? "",
        lead.email ?? "",
        lead.phone ?? "",
        lead.value?.toString() ?? "",
        stage?.name ?? "",
        lead.tags.join("; "),
        new Date(lead.createdAt).toISOString().split("T")[0],
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-8 py-6 border-b border-stone-200 dark:border-stone-800 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
            All leads
          </p>
          <h1 className="font-serif text-2xl tracking-tight">
            {leads?.length ?? 0} total
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={!leads || leads.length === 0}
            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
          >
            New lead
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-stone-100 dark:border-stone-900 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 w-64 bg-transparent border border-stone-200 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:border-stone-400"
        />

        <div className="flex items-center gap-2">
          {stages.map((stage) => (
            <button
              key={stage._id}
              onClick={() => setFilterStage(filterStage === stage._id ? "all" : stage._id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filterStage === stage._id
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white"
                  : "border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-400"
              }`}
            >
              {stage.name}
            </button>
          ))}
          {filterStage !== "all" && (
            <button
              onClick={() => setFilterStage("all")}
              className="text-xs text-stone-400 hover:text-stone-600 ml-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="px-8 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center gap-6">
          <span className="text-sm">
            {selectedIds.size} selected
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-60">Move to</span>
            {stages.map((stage) => (
              <button
                key={stage._id}
                onClick={async () => {
                  await bulkMove({
                    leadIds: Array.from(selectedIds),
                    toStageId: stage._id,
                  });
                  setSelectedIds(new Set());
                }}
                className="px-2 py-1 text-xs rounded bg-white/10 dark:bg-stone-900/10 hover:bg-white/20 dark:hover:bg-stone-900/20 transition-colors"
              >
                {stage.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleBulkDelete}
            className="text-sm text-red-300 dark:text-red-600 hover:text-red-200 dark:hover:text-red-700 ml-auto"
          >
            Delete
          </button>
          
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm opacity-60 hover:opacity-100"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="px-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800">
              <th className="w-12 py-4 text-left">
                <button
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    leads && selectedIds.size === leads.length && leads.length > 0
                      ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white"
                      : "border-stone-300 dark:border-stone-600 hover:border-stone-400"
                  }`}
                >
                  {leads && selectedIds.size === leads.length && leads.length > 0 && (
                    <svg className="w-2.5 h-2.5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </th>
              <th
                className="text-left py-4 text-xs uppercase tracking-widest text-stone-400 font-medium cursor-pointer hover:text-stone-900 dark:hover:text-white"
                onClick={() => handleSort("name")}
              >
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="text-left py-4 text-xs uppercase tracking-widest text-stone-400 font-medium cursor-pointer hover:text-stone-900 dark:hover:text-white"
                onClick={() => handleSort("company")}
              >
                Company {sortBy === "company" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-4 text-xs uppercase tracking-widest text-stone-400 font-medium">
                Stage
              </th>
              <th
                className="text-right py-4 text-xs uppercase tracking-widest text-stone-400 font-medium cursor-pointer hover:text-stone-900 dark:hover:text-white"
                onClick={() => handleSort("value")}
              >
                Value {sortBy === "value" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="text-right py-4 text-xs uppercase tracking-widest text-stone-400 font-medium cursor-pointer hover:text-stone-900 dark:hover:text-white"
                onClick={() => handleSort("createdAt")}
              >
                Created {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {leads?.map((lead) => {
              const stage = stageMap.get(lead.stageId);
              const isSelected = selectedIds.has(lead._id);
              return (
                <tr
                  key={lead._id}
                  className={`border-b border-stone-100 dark:border-stone-900 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors ${
                    isSelected ? "bg-stone-50 dark:bg-stone-900/50" : ""
                  }`}
                >
                  <td className="py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(lead._id);
                      }}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white"
                          : "border-stone-300 dark:border-stone-600 hover:border-stone-400"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td 
                    className="py-4 cursor-pointer" 
                    onClick={() => setSelectedLead(lead)}
                  >
                    <span className="font-medium">{lead.name}</span>
                  </td>
                  <td 
                    className="py-4 text-stone-500 cursor-pointer" 
                    onClick={() => setSelectedLead(lead)}
                  >
                    {lead.company ?? "—"}
                  </td>
                  <td 
                    className="py-4 cursor-pointer" 
                    onClick={() => setSelectedLead(lead)}
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm ${
                        stage?.isWon
                          ? "text-emerald-600"
                          : stage?.isLost
                            ? "text-stone-400"
                            : ""
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          stage?.isWon
                            ? "bg-emerald-500"
                            : stage?.isLost
                              ? "bg-stone-300"
                              : "bg-stone-400"
                        }`}
                      />
                      {stage?.name ?? "—"}
                    </span>
                  </td>
                  <td 
                    className="py-4 text-right cursor-pointer" 
                    onClick={() => setSelectedLead(lead)}
                  >
                    {lead.value !== undefined && lead.value !== null ? (
                      <span className="font-medium">
                        {currency}{lead.value.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td 
                    className="py-4 text-right text-stone-500 text-sm cursor-pointer" 
                    onClick={() => setSelectedLead(lead)}
                  >
                    {formatDate(lead.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {leads?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-400 mb-4">No leads found</p>
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="text-sm text-stone-900 dark:text-white underline"
            >
              Create your first lead
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewLeadModal && stages.length > 0 && (
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
