"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save,
  Database,
  Cloud,
  Bell,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { api, Setting } from "@/lib/api";

interface FieldDef {
  label: string;
  key: string;
  type: "text" | "number" | "password" | "toggle";
  placeholder?: string;
  description?: string;
  masked?: boolean;
  readOnly?: boolean;
}

interface SettingGroup {
  title: string;
  icon: React.ReactNode;
  fields: FieldDef[];
}

export default function SettingsPage() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const initialValues = useRef<Record<string, string>>({});

  // Fetch settings from API on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await api.getSettings();
      const map: Record<string, string> = {};
      settings.forEach((s: Setting) => {
        map[s.key] = s.value;
      });
      setValues(map);
      initialValues.current = { ...map };
      setDirty({});
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to load settings. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => ({
      ...prev,
      [key]: value !== (initialValues.current[key] || ""),
    }));
  };

  const hasChanges = Object.values(dirty).some(Boolean);

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);
    try {
      const changedEntries: Record<string, string> = {};
      for (const key of Object.keys(dirty)) {
        if (dirty[key]) {
          changedEntries[key] = values[key] || "";
        }
      }

      const updated = await api.updateSettings(changedEntries);
      const map: Record<string, string> = {};
      updated.forEach((s: Setting) => {
        map[s.key] = s.value;
      });
      setValues(map);
      initialValues.current = { ...map };
      setDirty({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const settingGroups: SettingGroup[] = [
    {
      title: "Backup Configuration",
      icon: <Database className="w-5 h-5 text-accent" />,
      fields: [
        {
          label: "Retention Days",
          key: "retention_days",
          type: "number",
          description: "Number of days to keep backups before auto-deletion",
        },
        {
          label: "Cron Schedule",
          key: "cron_schedule",
          type: "text",
          description: "Cron expression for scheduled backups",
          readOnly: true,
        },
        {
          label: "MongoDB Database",
          key: "mongo_db",
          type: "text",
          placeholder: "Leave empty for all databases",
          description: "Specific database to backup",
        },
      ],
    },
    {
      title: "Nextcloud Cloud Storage",
      icon: <Cloud className="w-5 h-5 text-info" />,
      fields: [
        {
          label: "Nextcloud Host URL",
          key: "rclone_host",
          type: "text",
          placeholder: "https://nextcloud.example.com/remote.php/dav/files/user/",
          description: "WebDAV URL for your Nextcloud storage",
        },
        {
          label: "Nextcloud Username",
          key: "rclone_user",
          type: "text",
          placeholder: "admin",
          description: "Nextcloud login username",
        },
        {
          label: "Nextcloud App Password",
          key: "rclone_pass",
          type: "password",
          masked: true,
          placeholder: "xxxx-xxxx-xxxx-xxxx",
          description: "Use an App Password for better security",
        },
        {
          label: "Destination Path",
          key: "rclone_path",
          type: "text",
          placeholder: "backups/",
          description: "Path on Nextcloud where backups will be saved",
        },
        {
          label: "Remote Identifier",
          key: "rclone_remote",
          type: "text",
          description: "Internal identifier for rclone (default: nextcloud)",
        },
      ],
    },
    {
      title: "Email Notifications",
      icon: <Bell className="w-5 h-5 text-warning" />,
      fields: [
        {
          label: "SMTP Host",
          key: "smtp_host",
          type: "text",
          placeholder: "smtp.gmail.com",
          description: "SMTP server hostname",
        },
        {
          label: "SMTP Port",
          key: "smtp_port",
          type: "number",
          description: "SMTP port (587/465)",
        },
        {
          label: "SMTP User",
          key: "smtp_user",
          type: "text",
          placeholder: "user@gmail.com",
          description: "SMTP username",
        },
        {
          label: "SMTP Password",
          key: "smtp_pass",
          type: "password",
          masked: true,
          placeholder: "App password",
          description: "SMTP authentication password",
        },
        {
          label: "From Email",
          key: "from_email",
          type: "text",
          placeholder: "backups@backendsafe.com",
        },
        {
          label: "Admin Recipient",
          key: "admin_email",
          type: "text",
          placeholder: "admin@example.com",
          description: "Receive failure alerts here",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent shadow-accent-glow" />
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Preferences</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            System Settings
          </h1>
          <p className="text-sm text-muted font-medium">
            Fine-tune your backup architecture, cloud sync, and notification engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-50 group"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            <span className="tracking-widest uppercase">Reload</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-bold text-white transition-all duration-300 disabled:opacity-40 group shadow-lg ${
              saved
                ? "bg-success"
                : hasChanges
                ? "bg-accent hover:brightness-110"
                : "bg-white/10 border border-white/10"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="tracking-widest uppercase">Applying...</span>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="tracking-widest uppercase">Changes Applied</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="tracking-widest uppercase">Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-danger/10 border border-danger/20 text-sm text-danger font-medium animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-premium h-full animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="w-36 h-5 rounded bg-white/5 animate-pulse" />
                </div>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="w-24 h-3 rounded bg-white/5 animate-pulse" />
                    <div className="w-full h-12 rounded-2xl bg-white/5 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {settingGroups.map((group, gi) => (
            <div
              key={group.title}
              className={`card-premium h-full transition-all duration-500 overflow-hidden group animate-fade-in ${
                group.title !== "Backup Configuration" ? "md:col-span-2" : ""
              }`}
              style={{ animationDelay: `${gi * 100}ms` }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {group.icon}
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">{group.title}</h2>
              </div>

              <div className={`${
                group.title !== "Backup Configuration"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
                  : "space-y-6"
              }`}>
                {group.fields.map((field) => {
                  const fieldValue = values[field.key] ?? "";
                  const isDirty = dirty[field.key] || false;

                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={field.key}
                          className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]"
                        >
                          {field.label}
                        </label>
                        {isDirty && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" title="Modified" />
                        )}
                      </div>

                      <div className="relative">
                        <input
                          id={field.key}
                          type={
                            field.type === "password" && !showPasswords[field.key]
                              ? "password"
                              : field.type === "number"
                              ? "number"
                              : "text"
                          }
                          value={fieldValue}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          readOnly={field.readOnly}
                          className={`w-full px-5 py-3 rounded-2xl bg-white/5 border text-sm font-bold text-white outline-none transition-all placeholder:text-muted/40 focus:border-accent/50 focus:ring-4 focus:ring-accent/10 ${
                            field.readOnly ? "opacity-40 cursor-not-allowed" : ""
                          } ${field.masked ? "pr-12" : ""} ${
                            isDirty
                              ? "border-accent/40 bg-accent/3"
                              : "border-white/10"
                          }`}
                        />
                        {field.masked && (
                          <button
                            type="button"
                            onClick={() => togglePassword(field.key)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/60 hover:text-white transition-colors"
                          >
                            {showPasswords[field.key] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {field.description && (
                        <p className="text-[10px] font-bold text-muted/60 mt-2 uppercase tracking-wider">{field.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
