const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;
    const authToken = token || this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      // Token expired — redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // --- Auth ---
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: { username: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
    }
    return data;
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" }).catch(() => {});
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  async getMe() {
    return this.request<{ user: { username: string } }>("/auth/me");
  }

  // --- Backups ---
  async getBackups(page = 1, limit = 20) {
    return this.request<{
      backups: Backup[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/backups?page=${page}&limit=${limit}`);
  }

  async getBackup(id: string) {
    return this.request<Backup>(`/backups/${id}`);
  }

  async getBackupStats() {
    return this.request<{
      total: number;
      successful: number;
      failed: number;
      lastBackup: Backup | null;
    }>("/backups/stats");
  }

  async triggerBackup() {
    return this.request<{ message: string; backupId: string }>("/backups/trigger", {
      method: "POST",
    });
  }

  async deleteBackup(id: string) {
    return this.request<{ message: string }>(`/backups/${id}`, {
      method: "DELETE",
    });
  }

  async restoreBackup(id: string) {
    return this.request<{ message: string }>(`/backups/${id}/restore`, {
      method: "POST",
    });
  }

  // --- Storage ---
  async getStorage() {
    return this.request<StorageInfo>("/storage");
  }

  async getStorageHistory(days = 30) {
    return this.request<StorageSnapshot[]>(`/storage/history?days=${days}`);
  }

  // --- Settings ---
  async getSettings() {
    return this.request<Setting[]>("/settings");
  }

  async updateSettings(settings: Record<string, string>) {
    return this.request<Setting[]>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }
}

// --- Types ---
export interface Backup {
  id: string;
  date: string;
  dbName: string;
  size: string;
  status: "success" | "failed" | "in_progress";
  filePath: string;
  duration: number | null;
  cloudSync: boolean;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageInfo {
  total: string;
  used: string;
  free: string;
  usePercent: number;
  backupSize: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  backupGB: number;
}

export interface StorageSnapshot {
  id: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  backupGB: number;
  date: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export const api = new ApiClient(API_BASE);
