"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvex, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/dashboard/Sidebar";
import CommandPalette from "@/components/dashboard/CommandPalette";
import NewLeadModal from "@/components/dashboard/NewLeadModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const convex = useConvex();
  const { isSignedIn } = useAuth();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [pendingGo, setPendingGo] = useState(false);

  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const pipelineData = useQuery(
    api.pipelines.getPipelineWithStages,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  // Initialize workspace on first load
  useEffect(() => {
    if (isSignedIn) {
      convex.mutation(api.workspaces.getOrCreateWorkspace, {});
    }
  }, [isSignedIn, convex]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Always allow Escape
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setNewLeadModalOpen(false);
        setPendingGo(false);
        return;
      }

      // Command palette: / or Cmd+K
      if (
        (e.key === "/" && !isInput) ||
        (e.key === "k" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (isInput) return;

      // N - New lead
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setNewLeadModalOpen(true);
        return;
      }

      // G + key navigation
      if (e.key === "g" || e.key === "G") {
        setPendingGo(true);
        setTimeout(() => setPendingGo(false), 1000);
        return;
      }

      if (pendingGo) {
        setPendingGo(false);
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            break;
          case "p":
            e.preventDefault();
            router.push("/pipeline");
            break;
          case "l":
            e.preventDefault();
            router.push("/leads");
            break;
          case "t":
            e.preventDefault();
            router.push("/tasks");
            break;
          case "o":
            e.preventDefault();
            router.push("/lists");
            break;
          case "i":
            e.preventDefault();
            router.push("/import");
            break;
          case "s":
            e.preventDefault();
            router.push("/settings");
            break;
        }
      }
    },
    [pendingGo, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      <Sidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      <main className="ml-56 min-h-screen">{children}</main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewLead={() => setNewLeadModalOpen(true)}
        workspaceId={workspace?._id ?? null}
      />

      {/* New Lead Modal (global) */}
      {newLeadModalOpen && workspace && pipelineData && pipelineData.stages.length > 0 && (
        <NewLeadModal
          workspaceId={workspace._id}
          pipelineId={pipelineData._id}
          stages={pipelineData.stages}
          onClose={() => setNewLeadModalOpen(false)}
        />
      )}

      {/* Pending "G" indicator */}
      {pendingGo && (
        <div className="fixed bottom-4 right-4 px-3 py-2 bg-stone-900 text-white text-xs rounded-lg shadow-lg">
          g → then <kbd className="ml-1 px-1 bg-stone-700 rounded">d</kbd>{" "}
          <kbd className="px-1 bg-stone-700 rounded">p</kbd>{" "}
          <kbd className="px-1 bg-stone-700 rounded">l</kbd>{" "}
          <kbd className="px-1 bg-stone-700 rounded">t</kbd>{" "}
          <kbd className="px-1 bg-stone-700 rounded">o</kbd>{" "}
          <kbd className="px-1 bg-stone-700 rounded">i</kbd>{" "}
          <kbd className="px-1 bg-stone-700 rounded">s</kbd>
        </div>
      )}
    </div>
  );
}
