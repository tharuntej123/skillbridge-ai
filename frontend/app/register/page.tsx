"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Lock, Mail, ArrowRight, Loader2, GraduationCap, Briefcase, Chrome } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // Default to student
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith("@gmail.com")) {
      setError("Only Gmail addresses are allowed for registration.");
      return;
    }

    setLoading(true);

    try {
      await api.register(trimmedEmail, password, role);
      await api.login(trimmedEmail, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith("@gmail.com")) {
      setError("Please enter your Gmail address first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.signInWithGoogle(trimmedEmail, role);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-accent/5 blur-[100px]" />

      <div className="max-w-md w-full space-y-8 glass-card p-8 md:p-10 rounded-3xl z-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join SkillBridge AI to start matching and learning
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">or register with email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>
          <div className="space-y-4">
            {/* Role Selection (Custom cards instead of dropdown) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                I want to join as a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                    role === "student"
                      ? "border-primary bg-primary/10 text-white"
                      : "border-white/5 bg-slate-950/30 text-muted-foreground hover:border-white/10 hover:text-white"
                  }`}
                >
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">Student / Learner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("freelancer")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                    role === "freelancer"
                      ? "border-primary bg-primary/10 text-white"
                      : "border-white/5 bg-slate-950/30 text-muted-foreground hover:border-white/10 hover:text-white"
                  }`}
                >
                  <Briefcase className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">Freelancer / Employer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Mail className="h-5 w-5 stroke-[1.5]" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3.5 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                  <Lock className="h-5 w-5 stroke-[1.5]" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3.5 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl btn-gradient py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <>
                  Register
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-indigo-400 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
