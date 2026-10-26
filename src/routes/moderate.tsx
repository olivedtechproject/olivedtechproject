import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCircle2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/moderate")({
  head: () => ({
    meta: [
      { title: "Moderator view — Olive" },
      { name: "description", content: "Olive moderators approve posts and tips before they go live." },
      { property: "og:title", content: "Moderator view — Olive" },
      { property: "og:description", content: "Olive moderators approve posts and tips before they go live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Moderate,
});

function Moderate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  return (
    <main className="mx-auto max-w-3xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Moderator view</h1>
      {session ? <Queue userId={session.user.id} /> : <SignIn />}
    </main>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent, mode: "in" | "up") {
    e.preventDefault();
    setBusy(true);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/moderate` } });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    if (mode === "up") toast.success("Check your email to confirm, then sign in.");
  }
  return (
    <form onSubmit={(e) => go(e, "in")} className="mt-8 space-y-3 rounded-[var(--radius)] bg-card p-6 shadow-soft">
      <p className="text-muted-foreground">Moderators only. Sign in to approve posts.</p>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="rounded-full">Sign in</Button>
        <Button type="button" variant="outline" disabled={busy} className="rounded-full" onClick={(e) => go(e, "up")}>Create account</Button>
      </div>
    </form>
  );
}

function Queue({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["mod-queue", userId],
    queryFn: async () => {
      const { data: isMod } = await supabase.rpc("has_role", { _user_id: userId, _role: "moderator" });
      if (!isMod) return { isMod: false, stories: [], tips: [] };
      const [s, t] = await Promise.all([
        supabase.from("stories").select("id, nickname, title, body").eq("status", "pending").order("created_at"),
        supabase.from("tips").select("id, nickname, title, body").eq("status", "pending").order("created_at"),
      ]);
      return { isMod: true, stories: s.data ?? [], tips: t.data ?? [] };
    },
  });

  async function decide(table: "stories" | "tips", id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) { toast.error("Couldn't update."); return; }
    toast.success(status === "approved" ? "Approved" : "Declined");
    qc.invalidateQueries({ queryKey: ["mod-queue"] });
  }

  const signOut = <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => supabase.auth.signOut()}>Sign out</Button>;
  if (isLoading || !data) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  if (!data.isMod) return <div className="mt-6 rounded-[var(--radius)] bg-card p-6 shadow-soft"><p>You're signed in, but you're not a moderator yet. Ask the site owner to add you.</p>{signOut}</div>;

  const items = [
    ...data.stories.map((x) => ({ ...x, table: "stories" as const, kind: "post" })),
    ...data.tips.map((x) => ({ ...x, table: "tips" as const, kind: "tip" })),
  ];
  return (
    <div className="mt-6 space-y-4">
      {items.length === 0 && <p className="text-muted-foreground">Nothing waiting. All caught up!</p>}
      {items.map((x) => (
        <article key={x.id} className="rounded-[var(--radius)] border border-border bg-card p-6">
          <p className="flex items-center gap-2 font-bold text-primary"><UserCircle2 className="h-5 w-5" /> {x.nickname} has asked for a {x.kind} approval</p>
          <h2 className="mt-2 text-xl font-bold">{x.title}</h2>
          <p className="mt-2 whitespace-pre-line text-foreground/90">{x.body}</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="rounded-full" onClick={() => decide(x.table, x.id, "approved")}>Approve</Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => decide(x.table, x.id, "rejected")}>Decline</Button>
          </div>
        </article>
      ))}
      {signOut}
    </div>
  );
}
