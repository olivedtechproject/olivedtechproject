import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/calm")({
  head: () => ({
    meta: [
      { title: "Cool Down — Olive" },
      { name: "description", content: "Tips and tricks to calm down and feel better, shared by teens for teens." },
      { property: "og:title", content: "Cool Down — Olive" },
      { property: "og:description", content: "Tips and tricks to calm down and feel better, shared by teens for teens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calm,
});

const scenarios = [
  { title: "Stressed about work and can't focus?", short: "Take a 5 minute break. Go to your room and lie down with the lights off.",
    tips: ["Put on calm music and close your eyes", "Breathe in for 4, hold for 4, out for 4 — five times", "Write a tiny to-do list: just the next 3 things", "Get a glass of water and stretch"] },
  { title: "Just had an argument and feel angry or sad?", short: "Distance yourself from the person. Taking a break can help you clear your head.",
    tips: ["Go for a fast walk outside", "Squeeze a pillow hard, then let go slowly", "Write everything down — you don't have to send it", "Ask yourself: how might they see it?"] },
  { title: "Feeling left out by your friends?", short: "Your feelings make sense. Do something that reminds you you matter.",
    tips: ["Text someone who always makes you laugh", "List 3 things you like about yourself", "Do a hobby you love for 15 minutes", "Tell a trusted adult how you feel"] },
  { title: "Embarrassed about something you said?", short: "Everyone says things they wish they hadn't. It feels huge now but it will shrink.",
    tips: ["Dance it out to a loud song", "Remind yourself: most people forget fast", "Plan one simple sentence to fix it", "Wrap up in a blanket with a warm drink"] },
  { title: "Can't stop thinking about it at night?", short: "Get the thoughts out of your head and onto paper.",
    tips: ["Journal for 5 minutes, then close the book", "Listen to a sleep story or rain sounds", "Tense and relax each muscle, toes to head", "Put your phone across the room"] },
  { title: "Feeling hurt by a family member?", short: "Give yourself space first, talk later when you're calm.",
    tips: ["Take a shower or wash your face", "Draw what the feeling looks like", "Talk to someone you trust", "Write what you want them to understand"] },
];

function Calm() {
  const [open, setOpen] = useState<number | null>(null);
  const { data: tips = [] } = useQuery({
    queryKey: ["tips"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tips").select("id, nickname, title, body").eq("status", "approved").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Cool Down</h1>
      <section className="mt-6 rounded-[var(--radius)] border-2 border-border bg-card p-8 shadow-soft">
        <h2 className="text-2xl font-bold underline decoration-primary underline-offset-8">Tips and Tricks</h2>
        <p className="mt-4 text-lg text-muted-foreground">These are some things you can do to make yourself calm down and feel better.</p>
      </section>

      <p className="mt-8 text-center font-semibold text-muted-foreground">★ Click on each scenario to read more and find different tips ★</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {scenarios.map((s, i) => (
          <button key={s.title} type="button" onClick={() => setOpen(open === i ? null : i)}
            className="rounded-[var(--radius)] border border-border bg-card/90 p-6 text-left transition-transform hover:-translate-y-0.5">
            <h3 className="flex items-start justify-between gap-2 text-xl font-bold">
              {s.title} <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </h3>
            <p className="mt-3 border-t border-border pt-3 text-foreground/90">– {s.short}</p>
            {open === i && (
              <ul className="mt-3 space-y-1">
                {s.tips.map((t) => <li key={t} className="text-foreground/90">– {t}</li>)}
              </ul>
            )}
          </button>
        ))}
        {tips.map((t) => (
          <div key={t.id} className="rounded-[var(--radius)] border border-border bg-secondary/60 p-6">
            <h3 className="text-xl font-bold">{t.title}</h3>
            <p className="mt-3 whitespace-pre-line border-t border-border pt-3">– {t.body}</p>
            <p className="mt-3 text-sm font-bold text-primary">Shared by {t.nickname}</p>
          </div>
        ))}
      </div>

      <MakeYourOwn />
    </main>
  );
}

function MakeYourOwn() {
  const [f, setF] = useState({ nickname: "", title: "", body: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nickname.trim() || f.title.trim().length < 3 || f.body.trim().length < 5) { toast.error("Fill in your nickname, the situation, and your tip."); return; }
    setBusy(true);
    const { error } = await supabase.from("tips").insert({ nickname: f.nickname.trim(), title: f.title.trim(), body: f.body.trim(), status: "pending" });
    setBusy(false);
    if (error) { toast.error("Couldn't send. Try again."); return; }
    setF({ nickname: f.nickname, title: "", body: "" });
    toast.success("Thanks! A moderator will check your tip before it shows up.");
  }
  return (
    <form onSubmit={submit} className="mt-10 space-y-3 rounded-[var(--radius)] border-2 border-border bg-card p-8 shadow-soft">
      <h2 className="text-2xl font-bold">Make your own!</h2>
      <p className="text-muted-foreground">Share what helps you calm down. Give your own tips and tricks, and help others in similar situations.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Your nickname" maxLength={30} value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value })} />
        <Input placeholder="The situation, e.g. Nervous before a test?" maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <Textarea rows={6} maxLength={2000} placeholder="What helps you?" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <Button type="submit" disabled={busy} className="rounded-full">Share my tip</Button>
    </form>
  );
}
