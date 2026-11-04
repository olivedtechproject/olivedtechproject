import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Dices,
  Shuffle,
  Users2,
  Sparkles,
  ShieldAlert,
  Headphones,
  Flame,
  Scale,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateRandomNickname } from "@/lib/nicknameGenerator";

export const Route = createFileRoute("/calm")({
  head: () => ({
    meta: [
      { title: "Cool Down — Olive" },
      {
        name: "description",
        content: "Tips and tricks to calm down and feel better, shared by teens for teens.",
      },
      { property: "og:title", content: "Cool Down — Olive" },
      {
        property: "og:description",
        content: "Tips and tricks to calm down and feel better, shared by teens for teens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calm,
});

type Category =
  "All" | "Sibling Conflicts" | "Arguments & Hurt" | "Stress & School" | "Friends & Social";

interface Scenario {
  title: string;
  category: "Sibling Conflicts" | "Arguments & Hurt" | "Stress & School" | "Friends & Social";
  icon?: typeof Users2;
  short: string;
  tips: string[];
}

const scenarios: Scenario[] = [
  {
    title: "Sibling crossed your boundaries or took your stuff?",
    category: "Sibling Conflicts",
    icon: ShieldAlert,
    short: "When privacy is violated at home, it feels invasive. Cool off before confronting them.",
    tips: [
      "Step away into a private space and take 5 slow, deep breaths before reacting",
      "Don't retaliate by hiding or breaking their things — that only shifts the blame onto you",
      "State your boundary clearly and calmly: 'You need to ask before borrowing my stuff. Please put it back now.'",
      "Keep special items in a safe container or designated spot, and agree on mutual borrowing rules when calm",
      "If it keeps happening, ask a parent to help establish a house boundary rule rather than screaming in the moment",
    ],
  },
  {
    title: "Sibling knows how to push your buttons and won't stop?",
    category: "Sibling Conflicts",
    icon: Headphones,
    short:
      "Siblings live with you and know your triggers. Removing your emotional reaction stops the game.",
    tips: [
      "Practice the 'Gray Rock' pause: respond with neutral, unbothered words ('Okay', 'Cool') with zero emotion",
      "Put on headphones or earbuds with music, a podcast, or white noise to disconnect from their teasing",
      "Physically remove yourself from the room or head outside into fresh air — without an audience, they lose interest fast",
      "Remind yourself: they might be bored, stressed, or seeking attention, but you control your own peace",
    ],
  },
  {
    title: "Furious after a heated shouting match with a brother or sister?",
    category: "Sibling Conflicts",
    icon: Flame,
    short: "Living under one roof makes fights feel intense. Hit the emergency reset button first.",
    tips: [
      "Splash cold water on your wrists and face — it triggers your dive reflex to immediately slow down a racing pulse",
      "Agree on a 20-minute 'truce cooldown': neither of you speaks until you've both had time to decompress",
      "Vent uncensored in a notes app or on paper, then delete or shred it once your body relaxes",
      "When ready to repair: 'I was really mad and shouldn't have yelled, but I want things to be okay between us. Can we reset?'",
    ],
  },
  {
    title: "Feeling like parents always take your sibling's side?",
    category: "Sibling Conflicts",
    icon: Scale,
    short:
      "Perceived favoritism or unfair blame stings deeply. Separate your sibling from the parental reaction.",
    tips: [
      "Wait until bedtime or quiet hours to talk with your parent 1-on-1 without your sibling in the room",
      "Use 'I' statements: 'I felt dismissed and unfairly blamed earlier when we had that disagreement'",
      "Focus on what you need (fair house rules, being heard) rather than tallying what your sibling got",
      "Remember: your worth and feelings are valid, even if a parent handled a sibling squabble clumsily in the moment",
    ],
  },
  {
    title: "Stressed about work and can't focus?",
    category: "Stress & School",
    short: "Take a 5 minute break. Go to your room and lie down with the lights off.",
    tips: [
      "Put on calm music and close your eyes",
      "Breathe in for 4, hold for 4, out for 4 — five times",
      "Write a tiny to-do list: just the next 3 things",
      "Get a glass of water and stretch",
    ],
  },
  {
    title: "Just had an argument and feel angry or sad?",
    category: "Arguments & Hurt",
    short: "Distance yourself from the person. Taking a break can help you clear your head.",
    tips: [
      "Go for a fast walk outside",
      "Squeeze a pillow hard, then let go slowly",
      "Write everything down — you don't have to send it",
      "Ask yourself: how might they see it?",
    ],
  },
  {
    title: "Feeling left out by your friends?",
    category: "Friends & Social",
    short: "Your feelings make sense. Do something that reminds you you matter.",
    tips: [
      "Text someone who always makes you laugh",
      "List 3 things you like about yourself",
      "Do a hobby you love for 15 minutes",
      "Tell a trusted adult how you feel",
    ],
  },
  {
    title: "Embarrassed about something you said?",
    category: "Friends & Social",
    short: "Everyone says things they wish they hadn't. It feels huge now but it will shrink.",
    tips: [
      "Dance it out to a loud song",
      "Remind yourself: most people forget fast",
      "Plan one simple sentence to fix it",
      "Wrap up in a blanket with a warm drink",
    ],
  },
  {
    title: "Can't stop thinking about it at night?",
    category: "Stress & School",
    short: "Get the thoughts out of your head and onto paper.",
    tips: [
      "Journal for 5 minutes, then close the book",
      "Listen to a sleep story or rain sounds",
      "Tense and relax each muscle, toes to head",
      "Put your phone across the room",
    ],
  },
  {
    title: "Feeling hurt by a family member?",
    category: "Arguments & Hurt",
    short: "Give yourself space first, talk later when you're calm.",
    tips: [
      "Take a shower or wash your face",
      "Draw what the feeling looks like",
      "Talk to someone you trust",
      "Write what you want them to understand",
    ],
  },
];

const categories: Category[] = [
  "All",
  "Sibling Conflicts",
  "Arguments & Hurt",
  "Stress & School",
  "Friends & Social",
];

const siblingStarters = [
  "Sibling took my stuff without asking",
  "Constant arguing over shared bedroom",
  "Sibling won't stop teasing me",
  "Parents always take my sibling's side",
];

function Calm() {
  const [open, setOpen] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const { data: tips = [] } = useQuery({
    queryKey: ["tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tips")
        .select("id, nickname, title, body")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredScenarios =
    selectedCategory === "All"
      ? scenarios
      : scenarios.filter((s) => s.category === selectedCategory);

  const siblingCount = scenarios.filter((s) => s.category === "Sibling Conflicts").length;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-12">
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">Cool Down</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Practical strategies, boundary reminders, and calming tips shared by teens for teens.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-[var(--radius)] border-2 border-border bg-card p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold underline decoration-primary underline-offset-8">
            Tips and Tricks
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/25 bg-navy/5 px-3 py-1 text-xs font-bold text-navy">
            <Sparkles className="h-3.5 w-3.5 text-navy" />
            <span>Includes Sibling Conflict Strategies</span>
          </span>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Whether you're dealing with sibling drama at home, school pressure, or an argument with a
          friend, these are actionable steps to ground yourself and de-escalate.
        </p>

        {/* Category Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/70 pt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Browse by Topic:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setOpen(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-navy text-navy-foreground shadow-xs ring-2 ring-navy/30"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {cat === "Sibling Conflicts" && <Users2 className="h-3.5 w-3.5" />}
                <span>{cat}</span>
                {cat === "Sibling Conflicts" && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-navy-foreground text-navy"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {siblingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <p className="mt-8 text-center font-semibold text-muted-foreground text-sm">
        ★ Click on any scenario to expand tips and action steps ★
      </p>

      {/* Scenarios Grid */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {filteredScenarios.map((s, i) => {
          const isSibling = s.category === "Sibling Conflicts";
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className={`rounded-[var(--radius)] border text-left transition-all hover:-translate-y-0.5 p-6 ${
                isSibling
                  ? "border-navy/25 bg-card/95 hover:border-navy shadow-soft"
                  : "border-border bg-card/90 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isSibling
                      ? "bg-navy/10 text-navy border border-navy/20"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {s.category}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </div>

              <h3 className="mt-2.5 text-xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-3 border-t border-border pt-3 text-sm text-foreground/90 font-medium leading-relaxed">
                – {s.short}
              </p>

              {open === i && (
                <ul className="mt-4 space-y-2 border-t border-border/60 pt-3">
                  {s.tips.map((t) => (
                    <li key={t} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}

        {/* User-submitted tips */}
        {selectedCategory === "All" &&
          tips.map((t) => (
            <div
              key={t.id}
              className="rounded-[var(--radius)] border border-border bg-secondary/60 p-6 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="inline-block rounded-full bg-card px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground border border-border">
                  Community Tip
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold">{t.title}</h3>
              <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm leading-relaxed">
                – {t.body}
              </p>
              <p className="mt-3 text-xs font-bold text-primary">Shared by {t.nickname}</p>
            </div>
          ))}
      </div>

      <MakeYourOwn />
    </main>
  );
}

function MakeYourOwn() {
  const [nickname, setNickname] = useState(() => generateRandomNickname());
  const [f, setF] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const activeNick = nickname.trim() || generateRandomNickname();
    if (f.title.trim().length < 3 || f.body.trim().length < 5) {
      toast.error("Fill in the situation and your tip.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("tips").insert({
      nickname: activeNick,
      title: f.title.trim(),
      body: f.body.trim(),
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send. Try again.");
      return;
    }

    setF({ title: "", body: "" });
    const nextNick = generateRandomNickname();
    setNickname(nextNick);

    toast.success("Thanks! A moderator will check your tip before it shows up.", {
      description: `Posted as "${activeNick}". Rolled new nickname ("${nextNick}") for your next tip!`,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-12 space-y-4 rounded-[var(--radius)] border-2 border-border bg-card p-8 shadow-soft"
    >
      <h2 className="text-2xl font-bold">Make your own!</h2>
      <p className="text-muted-foreground">
        Share what helps you calm down. Give your own tips and tricks for sibling fights, school
        stress, or friend drama, and help others in similar situations.
      </p>

      {/* Random Nickname Generator Display */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/20 bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy/25 bg-navy/10 text-navy shadow-2xs">
            <Dices className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span>Sharing anonymously as</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">{nickname}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const fresh = generateRandomNickname();
            setNickname(fresh);
            toast.info(`Rolled new nickname: ${fresh}`);
          }}
          className="rounded-full gap-1.5 text-xs font-semibold hover:border-navy hover:text-navy transition-colors"
          title="Roll a different nickname"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>Roll another name</span>
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Quick Situation Ideas:
        </p>
        <div className="flex flex-wrap gap-2">
          {siblingStarters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => setF((prev) => ({ ...prev, title: starter }))}
              className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs font-semibold hover:bg-secondary hover:border-navy/40 transition-colors"
            >
              + {starter}
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="The situation, e.g. Brother took my sweater without asking"
        maxLength={120}
        value={f.title}
        onChange={(e) => setF({ ...f, title: e.target.value })}
      />
      <Textarea
        rows={6}
        maxLength={2000}
        placeholder="What helps you cool down or handle it?"
        value={f.body}
        onChange={(e) => setF({ ...f, body: e.target.value })}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button type="submit" disabled={busy} className="rounded-full">
          Share my tip
        </Button>
        <span className="text-[11px] font-medium text-muted-foreground italic">
          A new nickname is rolled every time you share
        </span>
      </div>
    </form>
  );
}
