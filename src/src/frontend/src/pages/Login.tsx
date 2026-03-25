import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, Lock, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = login(username.trim(), password);
    setLoading(false);
    if (!ok) setError("Invalid username or password. Please try again.");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #3b0764 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              boxShadow: "0 0 32px rgba(251,191,36,0.4)",
            }}
          >
            <Gem className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            JewelTrack
          </h1>
          <p className="text-indigo-300 text-sm mt-1">Inventory &amp; Ledger</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-indigo-200 text-xs font-semibold uppercase tracking-wide">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus-visible:ring-amber-400 focus-visible:border-amber-400"
                  data-ocid="login.input"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-indigo-200 text-xs font-semibold uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus-visible:ring-amber-400 focus-visible:border-amber-400"
                  data-ocid="login.password_input"
                  required
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm"
                data-ocid="login.error_state"
              >
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 font-semibold text-base"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                color: "#1e1b4b",
              }}
              data-ocid="login.submit_button"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
