"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function DashboardPage() {
  const workspace = useQuery(api.workspaces.getCurrentWorkspace);
  const metrics = useQuery(
    api.analytics.getDashboardMetrics,
    workspace ? { workspaceId: workspace._id, range: "7d" } : "skip"
  );
  const usage = useQuery(
    api.workspaces.getUsage,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const tasksSummary = useQuery(
    api.tasks.getTasksSummary,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const recentActivity = useQuery(
    api.analytics.getRecentActivity,
    workspace ? { workspaceId: workspace._id, limit: 8 } : "skip"
  );

  if (!workspace) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  const winRate = metrics?.totalLeads
    ? Math.round((metrics.wonCount / metrics.totalLeads) * 100)
    : 0;

  const currency = workspace.settings?.currency || "$";

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-12 pt-12 pb-8 border-b border-stone-200 dark:border-stone-800">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
          Overview
        </p>
        <h1 className="font-serif text-4xl tracking-tight">
          {workspace.name?.replace("'s Workspace", "") || "Dashboard"}
        </h1>
      </header>

      {/* Key Metrics - Large Typography Focus */}
      <section className="px-12 py-10 border-b border-stone-200 dark:border-stone-800">
        <div className="grid grid-cols-5 gap-8">
          <div>
            <p className="font-serif text-5xl tracking-tight mb-1">
              {metrics?.totalLeads ?? 0}
            </p>
            <p className="text-sm text-stone-500">Total leads</p>
          </div>
          <div>
            <p className="font-serif text-5xl tracking-tight mb-1">
              {metrics?.openCount ?? 0}
            </p>
            <p className="text-sm text-stone-500">In pipeline</p>
          </div>
          <div>
            <p className="font-serif text-5xl tracking-tight text-emerald-600 dark:text-emerald-500 mb-1">
              {metrics?.wonCount ?? 0}
            </p>
            <p className="text-sm text-stone-500">Closed won</p>
          </div>
          <div>
            <p className="font-serif text-5xl tracking-tight text-red-400 dark:text-red-400 mb-1">
              {metrics?.lostCount ?? 0}
            </p>
            <p className="text-sm text-stone-500">Closed lost</p>
          </div>
          <div>
            <p className="font-serif text-5xl tracking-tight mb-1">
              {winRate}%
            </p>
            <p className="text-sm text-stone-500">Win rate</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3">
        {/* Pipeline Stages */}
        <section className="col-span-2 px-12 py-10 border-r border-stone-200 dark:border-stone-800">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest text-stone-400">
              Pipeline
            </h2>
            <Link
              href="/pipeline"
              className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-4">
            {metrics?.leadsByStage?.map((stage) => {
              const percentage = metrics.totalLeads
                ? (stage.count / metrics.totalLeads) * 100
                : 0;

              return (
                <div key={stage.stageId}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm">{stage.stageName}</span>
                    <span className="font-serif text-lg">{stage.count}</span>
                  </div>
                  <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stage.isWon
                          ? "bg-emerald-500"
                          : stage.isLost
                            ? "bg-stone-300 dark:bg-stone-600"
                            : "bg-stone-900 dark:bg-stone-300"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity Chart */}
          <div className="mt-12">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-6">
              New leads · Last 7 days
            </h2>
            <div className="flex items-end gap-1 h-24">
              {metrics?.leadsPerDay?.map((day) => {
                const maxCount = Math.max(
                  ...((metrics?.leadsPerDay ?? []).map((d) => d.count) || [1]),
                  1
                );
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                return (
                  <div key={day.date} className="flex-1 group relative">
                    <div
                      className="bg-stone-900 dark:bg-stone-200 rounded-sm transition-all duration-300 group-hover:bg-stone-700 dark:group-hover:bg-stone-400"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-stone-400 uppercase tracking-wider">
              <span>Mon</span>
              <span>Today</span>
            </div>
          </div>

          {/* Activity Feed */}
          {recentActivity && recentActivity.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-6">
                Recent activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity._id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p>
                        {activity.type === "created" && (
                          <>
                            <span className="font-medium">{activity.leadName}</span>
                            {" was created"}
                            {activity.data?.source === "import" && " via import"}
                          </>
                        )}
                        {activity.type === "stage_changed" && (
                          <>
                            <span className="font-medium">{activity.leadName}</span>
                            {" moved to "}
                            <span className="text-stone-600 dark:text-stone-400">
                              {activity.data?.toStageName}
                            </span>
                          </>
                        )}
                        {activity.type === "note_added" && (
                          <>
                            {"Note added to "}
                            <span className="font-medium">{activity.leadName}</span>
                          </>
                        )}
                        {activity.type === "value_changed" && (
                          <>
                            <span className="font-medium">{activity.leadName}</span>
                            {" value updated to "}
                            <span className="font-medium">
                              {currency}{activity.data?.toValue?.toLocaleString()}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-stone-400">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column */}
        <section className="px-8 py-10">
          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4">
              Quick actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/pipeline?new=true"
                className="block px-4 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm rounded-lg hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
              >
                Create new lead
              </Link>
              <Link
                href="/import"
                className="block px-4 py-3 border border-stone-200 dark:border-stone-700 text-sm rounded-lg hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
              >
                Import from CSV
              </Link>
            </div>
          </div>

          {/* Tasks Summary */}
          {tasksSummary && (
            <div className="mb-10">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xs uppercase tracking-widest text-stone-400">
                  Tasks
                </h2>
                <Link
                  href="/tasks"
                  className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="flex gap-4 mb-4">
                <div>
                  <p className="font-serif text-2xl">{tasksSummary.todo}</p>
                  <p className="text-xs text-stone-500">To do</p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-amber-500">{tasksSummary.inProgress}</p>
                  <p className="text-xs text-stone-500">In progress</p>
                </div>
                {tasksSummary.overdue > 0 && (
                  <div>
                    <p className="font-serif text-2xl text-red-500">
                      {tasksSummary.overdue}
                    </p>
                    <p className="text-xs text-stone-500">Overdue</p>
                  </div>
                )}
                {tasksSummary.highPriority > 0 && (
                  <div>
                    <p className="font-serif text-2xl text-red-400">
                      {tasksSummary.highPriority}
                    </p>
                    <p className="text-xs text-stone-500">High priority</p>
                  </div>
                )}
              </div>
              {tasksSummary.recentTasks.length > 0 && (
                <div className="space-y-2">
                  {tasksSummary.recentTasks.slice(0, 3).map((task) => (
                    <Link
                      key={task._id}
                      href="/tasks"
                      className="flex items-center gap-2 text-sm hover:text-stone-900 dark:hover:text-white transition-colors"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          task.priority === "high"
                            ? "bg-red-500"
                            : task.dueDate && task.dueDate < Date.now()
                              ? "bg-red-400"
                              : "bg-stone-300"
                        }`}
                      />
                      <span className="truncate flex-1">{task.title}</span>
                      {task.leadName && (
                        <span className="text-xs text-stone-400 truncate max-w-20">
                          {task.leadName}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Value */}
          {metrics && (metrics.openValue > 0 || metrics.wonValue > 0 || metrics.lostValue > 0) && (
            <div className="mb-10">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-3">
                Pipeline value
              </h2>
              {metrics.openValue > 0 && (
                <p className="font-serif text-3xl tracking-tight">
                  {currency}{metrics.openValue.toLocaleString()}
                </p>
              )}
              <div className="space-y-1 mt-2">
                {metrics.wonValue > 0 && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">
                    +{currency}{metrics.wonValue.toLocaleString()} won
                  </p>
                )}
                {metrics.lostValue > 0 && (
                  <p className="text-sm text-red-400">
                    -{currency}{metrics.lostValue.toLocaleString()} lost
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Usage */}
          {usage && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4">
                Usage
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-500">Leads</span>
                    <span>
                      {usage.usage?.leadCount ?? 0}/{usage.limits.MAX_LEADS}
                    </span>
                  </div>
                  <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400 rounded-full"
                      style={{
                        width: `${((usage.usage?.leadCount ?? 0) / usage.limits.MAX_LEADS) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-stone-400">
                  {usage.limits.MAX_LEADS - (usage.usage?.leadCount ?? 0)} remaining
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
