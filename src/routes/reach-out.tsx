import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/reach-out")({
  head: () => ({
    meta: [
      { title: "Reach Out — Common Ground" },
      { name: "description", content: "Write a caring letter to the other person in your conflict and take the first step to make things right." },
      { property: "og:title", content: "Reach Out — Common Ground" },
      { property: "og:description", content: "Write a caring letter to the other person and take the first step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReachOut,
});

const gifts = ["Hang out this weekend", "Bake or make you something", "Sit together at lunch", "A handwritten note", "Help you with something"];

function ReachOut() {
  const [f, setF] = useState({ to: "", toName: "", from: "", view: "", feel: "", gift: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const letter = `Hi ${f.toName || "there"},

I've been thinking about what happened between us.

How I saw it:
${f.view}

How I'm feeling:
${f.feel}

Something I'd like to do for you:
${f.gift}

I hope we can talk soon.
${f.from}`;

  const ready = f.to.includes("@") && f.view.trim() && f.feel.trim() && f.from.trim();
  const mailto = `mailto:${encodeURIComponent(f.to)}?subject=${encodeURIComponent(`A note from ${f.from}`)}&body=${encodeURIComponent(letter)}`;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Reach out</h1>
      <p className="mt-3 text-lg text-muted-foreground">Taking the first step is brave. Say how you saw it, how you feel, and something kind.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-[var(--radius)] bg-card p-6 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Their first name" value={f.toName} onChange={set("toName")} />
            <Input placeholder="Their email" type="email" value={f.to} onChange={set("to")} />
          </div>
          <label className="block font-bold">How I saw the situation
            <Textarea rows={4} className="mt-2 font-normal" placeholder="Use 'I' words: I thought… I noticed…" value={f.view} onChange={set("view")} />
          </label>
          <label className="block font-bold">What I'm feeling
            <Textarea rows={3} className="mt-2 font-normal" placeholder="I feel… because…" value={f.feel} onChange={set("feel")} />
          </label>
          <div>
            <p className="font-bold">A gift or something I'd like to do</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {gifts.map((g) => (
                <button key={g} type="button" onClick={() => setF({ ...f, gift: g })}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground hover:bg-accent">
                  {g}
                </button>
              ))}
            </div>
            <Textarea rows={2} className="mt-2" placeholder="Or write your own…" value={f.gift} onChange={set("gift")} />
          </div>
          <Input placeholder="Sign it with your name" value={f.from} onChange={set("from")} />
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-card/90 p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Your letter</p>
          <pre className="mt-4 whitespace-pre-wrap font-display text-lg leading-relaxed text-foreground">{letter}</pre>
          <Button asChild={!!ready} disabled={!ready} className="mt-6 rounded-full" size="lg">
            {ready ? <a href={mailto}>Send my letter</a> : <span>Fill in the boxes to send</span>}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">Tip: read it out loud once before sending. Would you want to receive it?</p>
        </div>
      </div>
    </main>
  );
}
