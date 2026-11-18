import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, LogOut, ShieldCheck, UserCheck, UserCircle2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAccountWithAssignedName, useAccountSession } from "@/lib/accountAuth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Olive" },
      {
        name: "description",
        content:
          "Create an Olive account and receive your permanent, Reddit-style anonymous username.",
      },
      { property: "og:title", content: "Account — Olive" },
      {
        property: "og:description",
        content:
          "Create an Olive account and receive your permanent, Reddit-style anonymous username.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { session, user, assignedUsername, loading, signOut } = useAccountSession();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingConfirmationName, setPendingConfirmationName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Enter a valid email and a password of at least 6 characters.");
      return;
    }

    setBusy(true);
    if (mode === "signin") {
      const res = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      setPendingConfirmationName(null);
      toast.success("Signed in!");
      return;
    }

    const res = await createAccountWithAssignedName(email, password, "/account");
    setBusy(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    if (res.data.session) {
      toast.success(`Welcome, ${res.assignedUsername}!`, {
        description: "Your permanent Olive username has been assigned and locked to your account.",
      });
    } else {
      setPendingConfirmationName(res.assignedUsername);
      toast.success("Account created! Check your email to confirm and sign in.", {
        description: `Your permanent assigned username is ${res.assignedUsername}.`,
      });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-12">
      <div className="mt-6">
        <h1 className="text-4xl font-bold md:text-5xl">Your Account</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Every Olive account receives an automatically generated anonymous username at creation
          that stays permanent and cannot be changed.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
          <p className="text-muted-foreground">Checking account status…</p>
        </div>
      ) : session && user && assignedUsername ? (
        <section className="mt-8 space-y-6 rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-navy/25 bg-navy/10 text-navy">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-navy">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Permanent Assigned Username (Locked)</span>
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold text-foreground">
                  {assignedUsername}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                toast.info("Signed out.");
              }}
              className="gap-1.5 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>

          <div className="rounded-xl border border-navy/20 bg-navy/[0.03] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
              <div>
                <h3 className="font-bold text-foreground">Why can&apos;t this name be changed?</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Just like Reddit&apos;s permanent handles, Olive assigns one random username when
                  you create your account and locks it. That keeps your real identity private while
                  building consistent accountability across stories, replies, and Cool Down tips.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/stories"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Post on Am I in the Wrong?
            </Link>
            <Link
              to="/calm"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
            >
              Browse &amp; Share Cool Down Tips
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
          {pendingConfirmationName && (
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-primary">
                <Lock className="h-4 w-4" />
                <span>Your permanent Olive username has been reserved</span>
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">
                {pendingConfirmationName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check your email ({email}) to confirm your account, then sign in. This name is
                permanently locked to your account and cannot be changed.
              </p>
            </div>
          )}

          {/* Mode Switch */}
          <div className="flex gap-2 border-b border-border pb-5">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === "signup"
                  ? "bg-navy text-navy-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === "signin"
                  ? "bg-navy text-navy-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <Lock className="h-4 w-4 text-navy" />
                  <span>Permanent Reddit-style Username Assignment</span>
                </p>
                <p className="mt-1">
                  When you create an account, Olive automatically assigns you a unique anonymous
                  name (like{" "}
                  <span className="font-semibold text-foreground">Mindful-Otter-482</span>
                  ). Once assigned, it cannot be edited or swapped.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to post and reply under your permanent assigned Olive username.
              </p>
            )}

            <div>
              <label className="block text-sm font-bold text-foreground">
                Email
                <Input
                  className="mt-1.5 font-normal"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground">
                Password
                <Input
                  className="mt-1.5 font-normal"
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>

            <Button type="submit" disabled={busy} className="rounded-lg">
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account & get my permanent name"
                  : "Sign in"}
            </Button>
          </form>
        </section>
      )}
    </main>
  );
}
