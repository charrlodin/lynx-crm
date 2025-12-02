"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewLead: () => void;
  workspaceId: Id<"workspaces"> | null;
}

type CommandType = "navigation" | "action" | "lead" | "list";

interface Command {
  id: string;
  type: CommandType;
  label: string;
  sublabel?: string;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNewLead,
  workspaceId,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchResults = useQuery(
    api.search.searchLeads,
    workspaceId && query.length > 0
      ? { workspaceId, query, limit: 5 }
      : "skip"
  );

  const recentLeads = useQuery(
    api.search.getRecentLeads,
    workspaceId && query.length === 0
      ? { workspaceId, limit: 5 }
      : "skip"
  );

  const listResults = useQuery(
    api.lists.searchLists,
    workspaceId && query.length > 0
      ? { workspaceId, query }
      : "skip"
  );

  // Build command list using useMemo
  const leadsToShow = query.length > 0 ? searchResults : recentLeads;

  const commands = useMemo(() => {
    const result: Command[] = [];

    // Navigation commands
    const navCommands: Command[] = [
      {
        id: "nav-dashboard",
        type: "navigation",
        label: "Go to Dashboard",
        shortcut: "G D",
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-pipeline",
        type: "navigation",
        label: "Go to Pipeline",
        shortcut: "G P",
        action: () => {
          router.push("/pipeline");
          onClose();
        },
      },
      {
        id: "nav-leads",
        type: "navigation",
        label: "Go to Leads",
        shortcut: "G L",
        action: () => {
          router.push("/leads");
          onClose();
        },
      },
      {
        id: "nav-tasks",
        type: "navigation",
        label: "Go to Tasks",
        shortcut: "G T",
        action: () => {
          router.push("/tasks");
          onClose();
        },
      },
      {
        id: "nav-lists",
        type: "navigation",
        label: "Go to Lists",
        shortcut: "G O",
        action: () => {
          router.push("/lists");
          onClose();
        },
      },
      {
        id: "nav-import",
        type: "navigation",
        label: "Go to Import",
        action: () => {
          router.push("/import");
          onClose();
        },
      },
      {
        id: "nav-settings",
        type: "navigation",
        label: "Go to Settings",
        action: () => {
          router.push("/settings");
          onClose();
        },
      },
    ];

    // Action commands
    const actionCommands: Command[] = [
      {
        id: "action-new-lead",
        type: "action",
        label: "Create new lead",
        shortcut: "N",
        action: () => {
          onNewLead();
          onClose();
        },
      },
      {
        id: "action-import",
        type: "action",
        label: "Import from CSV",
        action: () => {
          router.push("/import");
          onClose();
        },
      },
    ];

    // Add search results or recent leads
    if (leadsToShow) {
      leadsToShow.forEach((lead) => {
        result.push({
          id: `lead-${lead._id}`,
          type: "lead",
          label: lead.name,
          sublabel: lead.company ?? lead.email,
          action: () => {
            router.push(`/leads?open=${lead._id}`);
            onClose();
          },
        });
      });
    }

    // Add list search results
    if (listResults && query.length > 0) {
      listResults.forEach((list) => {
        result.push({
          id: `list-${list._id}`,
          type: "list",
          label: list.name,
          sublabel: list.description || "List",
          action: () => {
            router.push(`/lists?selected=${list._id}`);
            onClose();
          },
        });
      });
    }

    // Filter nav/action commands by query
    if (query.length > 0) {
      const queryLower = query.toLowerCase();
      navCommands
        .filter((c) => c.label.toLowerCase().includes(queryLower))
        .forEach((c) => result.push(c));
      actionCommands
        .filter((c) => c.label.toLowerCase().includes(queryLower))
        .forEach((c) => result.push(c));
    } else {
      result.push(...actionCommands);
      result.push(...navCommands);
    }

    return result;
  }, [query, leadsToShow, listResults, router, onClose, onNewLead]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, searchResults, recentLeads]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, commands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [commands, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />

      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search leads, commands..."
              className="w-full bg-transparent text-lg focus:outline-none placeholder:text-stone-400"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {commands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-stone-400">
                No results found
              </div>
            ) : (
              <>
                {/* Group by type */}
                {query.length === 0 && leadsToShow && leadsToShow.length > 0 && (
                  <div className="px-3 py-1.5 text-xs text-stone-400">
                    Recent leads
                  </div>
                )}
                {query.length > 0 && leadsToShow && leadsToShow.length > 0 && (
                  <div className="px-3 py-1.5 text-xs text-stone-400">
                    Leads
                  </div>
                )}

                {commands.map((command, index) => {
                  const isSelected = index === selectedIndex;
                  const showActionHeader =
                    index ===
                      commands.findIndex((c) => c.type === "action") &&
                    command.type === "action";
                  const showNavHeader =
                    index ===
                      commands.findIndex((c) => c.type === "navigation") &&
                    command.type === "navigation";
                  const showListHeader =
                    index ===
                      commands.findIndex((c) => c.type === "list") &&
                    command.type === "list";

                  return (
                    <div key={command.id}>
                      {showActionHeader && (
                        <div className="px-3 py-1.5 text-xs text-stone-400 mt-2">
                          Actions
                        </div>
                      )}
                      {showNavHeader && (
                        <div className="px-3 py-1.5 text-xs text-stone-400 mt-2">
                          Navigation
                        </div>
                      )}
                      {showListHeader && (
                        <div className="px-3 py-1.5 text-xs text-stone-400 mt-2">
                          Lists
                        </div>
                      )}
                      <button
                        className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${
                          isSelected
                            ? "bg-stone-100 dark:bg-stone-900"
                            : "hover:bg-stone-50 dark:hover:bg-stone-900/50"
                        }`}
                        onClick={command.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div>
                          <span className="text-sm">{command.label}</span>
                          {command.sublabel && (
                            <span className="ml-2 text-xs text-stone-400">
                              {command.sublabel}
                            </span>
                          )}
                        </div>
                        {command.shortcut && (
                          <kbd className="text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono">
                            {command.shortcut}
                          </kbd>
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-stone-200 dark:border-stone-800 flex items-center gap-4 text-[10px] text-stone-400">
            <span>
              <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-mono">↵</kbd> select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-mono">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
