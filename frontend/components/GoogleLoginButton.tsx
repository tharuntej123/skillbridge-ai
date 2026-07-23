"use client";

import { Chrome, Loader2 } from "lucide-react";
import { useState } from "react";

interface GoogleLoginButtonProps {
  role?: string;
  label?: string;
  className?: string;
}

export function GoogleLoginButton({ role = "student", label = "Continue with Google", className }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${backendUrl}/api/auth/google/login?role=${encodeURIComponent(role)}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className || "flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all disabled:opacity-50"}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
      {label}
    </button>
  );
}
