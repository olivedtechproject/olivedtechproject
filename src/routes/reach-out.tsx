import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/reach-out")({
  head: () => ({
    meta: [
      { title: "Reach Out — Olive" },
      { name: "description", content: "Send an anonymous or signed note to the other person in your conflict, with a gift or kind gesture." },
      { property: "og:title", content: "Reach Out — Olive" },
      { property: "og:description", content: "Send a caring note to the other person and take the first step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReachOut,
});

const giftCards = ["Amazon gift card", "Roblox gift card", "Spotify gift card", "Starbucks gift card"];
const gestures = ["Hang out this weekend", "Bake or make you something", "Sit together at lunch", "A handwritten note"];

function ReachOut() {
  const [f, setF] = useState({ to: "", toName: "", message: "", feel: "", view: "", forward: "", gift: "", from: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const signoff = f.from.trim() || "Anonymous";

  const letter = [
    `To ${f.toName || "you"},`,
    f.message,
    f.feel && `What I was feeling:\n${f.feel}`,
    f.view && `How I saw the situation:\n${f.view}`,
    f.forward && `How I'd like to move forward:\n${f.forward}`,
    f.gift && `A little something for you: ${f.gift}`,
    `Warmly,\n${signoff}`,
  ].filter(Boolean).join("\n\n");

  const ready = f.to.includes("@") && (f.message.trim() || f.feel.trim());
  const mailto = `mailto:${encodeURIComponent(f.to)}?subject=${encodeURIComponent("A note for you, sent through Olive")}&body=${encodeURIComponent(letter)}`;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Reach Out</h1>
      <p className="mt-3 text-lg text-muted-foreground">Taking the first step is brave. You can sign your name or stay anonymous.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-[var(--radius)] bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-bold">Anonymous Contact</h2>
          <label className="block font-bold">Who are you apologizing to?
            <Input className="mt-2 font-normal" placeholder="Ex. John Doe" value={f.toName} onChange={set("toName")} />
          </label>
          <label className="block font-bold">What's their email?
            <Input className="mt-2 font-normal" type="email" placeholder="Ex. johndoe@email.com" value={f.to} onChange={set("to")} />
          </label>
          <label className="block font-bold">What do you want to say to them?
            <Textarea rows={5} className="mt-2 font-normal" value={f.message} onChange={set("message")} />
          </label>
          <label className="block font-bold">Sign it (leave empty to stay anonymous)
            <Input className="mt-2 font-normal" placeholder="Anonymous / your name" value={f.from} onChange={set("from")} />
          </label>
        </div>

        <div className="space-y-4 rounded-[var(--radius)] bg-card p-6 shadow-soft">
          <div>
            <p className="font-bold">Choose your gift</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Gift cards</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {giftCards.map((g) => <GiftChip key={g} label={g} active={f.gift === g} onClick={() => setF({ ...f, gift: f.gift === g ? "" : g })} />)}
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Kind gestures</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {gestures.map((g) => <GiftChip key={g} label={g} active={f.gift === g} onClick={() => setF({ ...f, gift: f.gift === g ? "" : g })} />)}
            </div>
          </div>
          <label className="block font-bold">What were you feeling?
            <Textarea rows={2} className="mt-2 font-normal" placeholder="I felt… because…" value={f.feel} onChange={set("feel")} />
          </label>
          <label className="block font-bold">How did you see the situation?
            <Textarea rows={2} className="mt-2 font-normal" placeholder="I thought… I noticed…" value={f.view} onChange={set("view")} />
          </label>
          <label className="block font-bold">How would you like to move forward?
            <Textarea rows={2} className="mt-2 font-normal" placeholder="I'd like us to…" value={f.forward} onChange={set("forward")} />
          </label>
        </div>
      </div>

      <div className="mt-8 rounded-[var(--radius)] border border-border bg-card/90 p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Your note</p>
        <pre className="mt-4 whitespace-pre-wrap font-display text-lg leading-relaxed text-foreground">{letter}</pre>
        <Button asChild={!!ready} disabled={!ready} className="mt-6 rounded-full" size="lg">
          {ready ? <a href={mailto}>Send my note</a> : <span>Add their email and a message to send</span>}
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">This opens your email app. Gift cards are bought separately — the note just lets them know.</p>
      </div>
    </main>
  );
}

function GiftChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground hover:bg-accent"}`}>
      {label}
    </button>
  );
}
