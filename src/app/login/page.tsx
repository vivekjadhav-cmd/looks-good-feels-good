"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // New user → onboarding
      router.push("/onboarding");
    } else {
      // Existing user → check if onboarded
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .single();

      router.push(profile?.onboarding_complete ? "/home" : "/onboarding");
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-heading-lg text-warm-800">
            looks good,
          </h1>
          <h1 className="font-display text-heading-lg text-warm-600">
            feels good
          </h1>
          <p className="text-body-md text-neutral-600 mt-2">
            {isSignUp
              ? "Create your account to get styled"
              : "Welcome back, gorgeous"}
          </p>
        </div>

        {/* Google OAuth */}
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-3 mb-4"
          onClick={handleGoogleAuth}
          loading={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-body-sm text-neutral-400">or</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            minLength={6}
            required
          />

          {error && (
            <p className="text-body-sm text-blush-600 bg-blush-50 rounded-card px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {isSignUp ? "Create account" : "Log in"}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-body-md text-neutral-600 mt-6">
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sage-600 font-medium hover:underline"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
