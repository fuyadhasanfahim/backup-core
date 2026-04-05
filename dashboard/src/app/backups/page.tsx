"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Backup } from "@/lib/api";
import {
  RefreshCw,
  PlayCircle,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Cloud,
  CloudOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    type: "delete" | "restore";
    backup: Backup;
  } | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await api.getBackups(page, 15);
      setBackups(res.backups);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error("Fetch backups error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  // Poll for in_progress backups
  useEffect(() => {
    const hasInProgress = backups.some((b) => b.status === "in_progress");
    if (!hasInProgress) return;

    const interval = setInterval(fetchBackups, 3000);
    return () => clearInterval(interval);
  }, [backups, fetchBackups]);

  const handleTriggerBackup = async () => {
    setIsTriggering(true);
    try {
      await api.triggerBackup();
      await fetchBackups();
    } catch (err) {
      alert((err as Error).message || "Failed to trigger backup");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDelete = async (backup: Backup) => {
    setActionId(backup.id);
    try {
      await api.deleteBackup(backup.id);
      setModal(null);
      await fetchBackups();
    } catch (err) {
      alert((err as Error).message || "Failed to delete backup");
    } finally {
      setActionId(null);
    }
  };

  const handleRestore = async (backup: Backup) => {
    setActionId(backup.id);
    try {
      await api.restoreBackup(backup.id);
      setModal(null);
      alert("Restore started successfully");
    } catch (err) {
      alert((err as Error).message || "Failed to restore");
    } finally {
      setActionId(null);
    }
  };

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      label: "Success",
      className: "badge-success",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      className: "badge-danger",
    },
    in_progress: {
      icon: Clock,
      label: "Running",
      className: "badge-warning",
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backups</h1>
          <p className="text-sm text-muted">
            {total} total backup{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-secondary hover:bg-surface-hover hover:text-foreground transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleTriggerBackup}
            disabled={isTriggering}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-(--gradient-start) to-(--gradient-end) text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            {isTriggering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Backup Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card-glow rounded-xl bg-surface overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Date",
                  "Database",
                  "Size",
                  "Duration",
                  "Status",
                  "Cloud",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-surface-hover shimmer" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : backups.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-muted text-sm"
                  >
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No backups found. Click {"Backup Now"} to create your first
                    backup.
                  </td>
                </tr>
              ) : (
                backups.map((backup, i) => {
                  const status =
                    statusConfig[backup.status as keyof typeof statusConfig] ||
                    statusConfig.success;
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={backup.id}
                      className="border-b border-border hover:bg-surface-hover transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-5 py-4 text-sm text-foreground">
                        {new Date(backup.date).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-foreground">
                        {backup.dbName}
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary">
                        {backup.size}
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary">
                        {backup.duration ? `${backup.duration}s` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon
                            className={`w-3.5 h-3.5 ${
                              backup.status === "in_progress"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {backup.cloudSync ? (
                          <Cloud className="w-4 h-4 text-accent" />
                        ) : (
                          <CloudOff className="w-4 h-4 text-muted opacity-40" />
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setModal({ type: "restore", backup })
                            }
                            title="Restore"
                            className="p-1.5 rounded-lg text-muted hover:text-info hover:bg-(--info-bg) transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", backup })}
                            title="Delete"
                            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-100 glass-strong rounded-2xl p-6 shadow-2xl animate-fade-in">
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  modal.type === "delete"
                    ? "bg-(--danger-bg)"
                    : "bg-(--warning-bg)"
                }`}
              >
                <AlertTriangle
                  className="w-7 h-7"
                  style={{
                    color:
                      modal.type === "delete"
                        ? "var(--danger)"
                        : "var(--warning)",
                  }}
                />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">
                {modal.type === "delete" ? "Delete Backup" : "Restore Backup"}
              </h3>
              <p className="text-sm text-muted mb-6">
                {modal.type === "delete"
                  ? "This will permanently delete the backup file and record. This action cannot be undone."
                  : "This will restore the database from this backup. Current data may be overwritten."}
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-hover text-sm font-medium text-secondary hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    modal.type === "delete"
                      ? handleDelete(modal.backup)
                      : handleRestore(modal.backup)
                  }
                  disabled={actionId === modal.backup.id}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    modal.type === "delete"
                      ? "bg-danger hover:opacity-90"
                      : "bg-warning hover:opacity-90"
                  }`}
                >
                  {actionId === modal.backup.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : modal.type === "delete" ? (
                    "Delete"
                  ) : (
                    "Restore"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
