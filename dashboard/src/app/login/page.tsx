"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, var(--gradient-start), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[30%] -right-[20%] w-[50%] h-[50%] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, var(--gradient-end), transparent 70%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-100 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-(--gradient-start) to-(--gradient-end) flex items-center justify-center mb-4 shadow-(--accent-glow) pulse-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">BackendSafe</h1>
          <p className="text-sm text-muted mt-1">
            Backup Control Panel
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-7 space-y-5 shadow-2xl"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted">
              Sign in to your dashboard
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg badge-danger text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-secondary mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-border text-foreground text-sm outline-none transition-all placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-(--accent-glow)"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-secondary mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-surface-hover border border-border text-foreground text-sm outline-none transition-all placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-(--accent-glow)"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-linear-to-r from-(--gradient-start) to-(--gradient-end) text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          Secured by BackendSafe • v1.0
        </p>
      </div>
    </div>
  );
}
