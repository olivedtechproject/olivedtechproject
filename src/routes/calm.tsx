import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/calm")({
  head: () => ({
    meta: [
      { title: "Cool Down — Olive" },
      { name: "description", content: "Pick how you feel and get ideas to calm and channel big emotions." },
      { property: "og:title", content: "Cool Down — Olive" },
      { property: "og:description", content: "Pick how you feel and get ideas to calm and channel big emotions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calm,
});

type Energy = "rest" | "move" | "create" | "talk";
const feelings = [
  { id: "angry", emoji: "😠", label: "Angry" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "anxious", emoji: "😰", label: "Worried" },
  { id: "hurt", emoji: "💔", label: "Hurt" },
  { id: "embarrassed", emoji: "😳", label: "Embarrassed" },
  { id: "confused", emoji: "😕", label: "Confused" },
] as const;
type FeelingId = (typeof feelings)[number]["id"];

const ideas: { text: string; feelings: FeelingId[]; energy: Energy; time: string }[] = [
  { text: "Lie down and listen to your favorite calm music", feelings: ["sad", "hurt", "anxious", "angry"], energy: "rest", time: "10 min" },
  { text: "Breathe in for 4, hold for 4, out for 4 — repeat 5 times", feelings: ["angry", "anxious", "embarrassed"], energy: "rest", time: "2 min" },
  { text: "Wrap up in a blanket with a warm drink", feelings: ["sad", "hurt"], energy: "rest", time: "15 min" },
  { text: "Go for a fast walk or run around outside", feelings: ["angry", "anxious"], energy: "move", time: "15 min" },
  { text: "Squeeze a pillow hard, then let go slowly", feelings: ["angry", "embarrassed"], energy: "move", time: "2 min" },
  { text: "Dance it out to a loud song", feelings: ["angry", "sad", "embarrassed"], energy: "move", time: "5 min" },
  { text: "Stretch slowly, from your toes up to your fingertips", feelings: ["anxious", "confused", "hurt"], energy: "move", time: "5 min" },
  { text: "Write everything down — you don't have to send it", feelings: ["angry", "confused", "hurt", "sad"], energy: "create", time: "10 min" },
  { text: "Draw or doodle what the feeling looks like", feelings: ["confused", "sad", "anxious"], energy: "create", time: "10 min" },
  { text: "List 3 things that went okay today", feelings: ["sad", "embarrassed", "hurt"], energy: "create", time: "3 min" },
  { text: "Tell a pet, a parent, or a trusted adult what happened", feelings: ["hurt", "confused", "sad", "anxious"], energy: "talk", time: "10 min" },
  { text: "Ask yourself: how might the other person see it?", feelings: ["confused", "angry"], energy: "talk", time: "5 min" },
];

const energies: { id: Energy; label: string }[] = [
  { id: "rest", label: "Be still" },
  { id: "move", label: "Move my body" },
  { id: "create", label: "Make something" },
  { id: "talk", label: "Talk it out" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"}`}
    >
      {children}
    </button>
  );
}

function Calm() {
  const [feeling, setFeeling] = useState<FeelingId | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const list = ideas.filter((i) => (!feeling || i.feelings.includes(feeling)) && (!energy || i.energy === energy));

  return (
    <main className="mx-auto max-w-5xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Cool Down</h1>
      <p className="mt-3 text-lg text-muted-foreground">Big feelings are normal. Choose what fits, then try one idea.</p>

      <div className="mt-8 rounded-[var(--radius)] bg-card p-6 shadow-soft">
        <h2 className="text-xl font-bold">Right now I feel…</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {feelings.map((f) => (
            <Chip key={f.id} active={feeling === f.id} onClick={() => setFeeling(feeling === f.id ? null : f.id)}>
              {f.emoji} {f.label}
            </Chip>
          ))}
        </div>
        <h2 className="mt-6 text-xl font-bold">And I'd rather…</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {energies.map((e) => (
            <Chip key={e.id} active={energy === e.id} onClick={() => setEnergy(energy === e.id ? null : e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => (
          <div key={i.text} className="rounded-[var(--radius)] border border-border bg-card/80 p-5">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              {energies.find((e) => e.id === i.energy)?.label} · {i.time}
            </span>
            <p className="mt-3 text-lg font-semibold">{i.text}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No match — try a different choice.</p>}
      </div>
    </main>
  );
}
