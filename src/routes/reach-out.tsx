import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AiModeratorFeedback } from "@/components/AiModeratorFeedback";
import { moderateWithAI, type AiModerationResult } from "@/lib/aiModerator";

export const Route = createFileRoute("/reach-out")({
  head: () => ({
    meta: [
      { title: "Reach Out — Olive" },
      {
        name: "description",
        content:
          "Send an anonymous or signed note to the other person in your conflict, with a gift or kind gesture.",
      },
      { property: "og:title", content: "Reach Out — Olive" },
      {
        property: "og:description",
        content: "Send a caring note to the other person and take the first step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReachOut,
});

const giftCards = [
  "Amazon gift card",
  "Roblox gift card",
  "Spotify gift card",
  "Starbucks gift card",
];
const gestures = [
  "Hang out this weekend",
  "Bake or make you something",
  "Sit together at lunch",
  "A handwritten note",
];

const messageStarters = [
  "I'm sorry for how I reacted the other day",
  "I wanted to reach out because our friendship means a lot to me",
  "I've been thinking about what happened and want to apologize",
  "I realize I didn't handle things well and I regret what I said",
  "Thank you for being patient with me while I cooled off",
  "I miss hanging out and wanted to apologize for my part",
  "I value having you in my life and hope we can talk",
];

const feelStarters = [
  "I felt overwhelmed and reacted out of frustration",
  "I felt hurt and insecure in the moment",
  "I was having a rough day and took my stress out on you",
  "I felt like I wasn't being heard, but yelling wasn't the right answer",
  "I was embarrassed and put my defensive guard up",
  "I felt left out and jumped to conclusions",
];

const viewStarters = [
  "I see now how my words and tone sounded harsh",
  "I was only focused on my side and didn't consider yours",
  "I thought you were ignoring me, but I should have asked first",
  "I didn't realize how much my actions affected you until now",
  "Looking back, we were both stressed and things escalated fast",
  "I understand why you felt upset with me and you had a right to be",
];

const forwardStarters = [
  "Can we hit the reset button and start fresh?",
  "I'd love to talk when you're ready, no pressure at all",
  "Could we grab lunch or hang out sometime this week?",
  "Let's agree on how we can handle disagreements better next time",
  "I'm ready to listen to your side whenever you feel comfortable",
  "Even if you need space right now, I wanted you to know I care",
];

const tutorialSteps = [
  {
    step: "01",
    title: "Check in with yourself first",
    detail:
      "Take a minute to cool down before writing so your message comes from honesty rather than anger.",
  },
  {
    step: "02",
    title: "Add who you're writing to",
    detail:
      "Enter their name and email, then write your opening—or turn on sentence starters for ready-to-use ideas.",
  },
  {
    step: "03",
    title: "Share feelings & next steps",
    detail:
      "Fill in how you felt, how you saw things, how you'd like to move forward, and an optional kind gesture.",
  },
  {
    step: "04",
    title: "Preview & send (or talk)",
    detail:
      "Review the live note preview below, choose to sign or stay anonymous, and open your email app to send.",
  },
];

function ReachOut() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setShowTutorial(true);
  }, []);

  const [allowStarters, setAllowStarters] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem("olive-allow-starters");
      return stored !== "false";
    } catch {
      return true;
    }
  });

  const [f, setF] = useState({
    to: "",
    toName: "",
    message: "",
    feel: "",
    view: "",
    forward: "",
    gift: "",
    from: "",
  });
  const [modBusy, setModBusy] = useState(false);
  const [modResult, setModResult] = useState<AiModerationResult | null>(null);
  const [modError, setModError] = useState<string | null>(null);

  const toggleStarters = () => {
    setAllowStarters((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("olive-allow-starters", String(next));
      } catch {
        // ignore
      }
      toast.info(next ? "Sentence starters allowed" : "Sentence starters hidden");
      return next;
    });
  };

  const addStarter = (k: "message" | "feel" | "view" | "forward", starter: string) => {
    setF((prev) => {
      const current = prev[k].trim();
      const updatedVal = current ? `${current}\n${starter} ` : `${starter} `;
      const updated = { ...prev, [k]: updatedVal };
      try {
        const snippet = [updated.message, updated.feel, updated.view].filter(Boolean).join(" ");
        if (snippet.length > 5) {
          localStorage.setItem("olive_reachout_draft", snippet.slice(0, 300));
        }
      } catch {
        // ignore
      }
      return updated;
    });
    toast.success("Added to note!", { duration: 1500 });
  };

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const updated = { ...f, [k]: e.target.value };
      setF(updated);
      setModResult(null);
      setModError(null);
      try {
        const snippet = [updated.message, updated.feel, updated.view].filter(Boolean).join(" ");
        if (snippet.length > 5) {
          localStorage.setItem("olive_reachout_draft", snippet.slice(0, 300));
        }
      } catch {
        // ignore
      }
    };

  async function runReachOutSafetyCheck() {
    const noteBody = [f.message, f.feel, f.view, f.forward]
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n\n");

    if (noteBody.length < 2) {
      toast.error("Write a short message first so the AI Moderator can review it.");
      return;
    }

    setModBusy(true);
    setModError(null);
    const res = await moderateWithAI({
      data: {
        contentType: "reach-out",
        title: f.toName.trim() ? `Note to ${f.toName.trim()}` : undefined,
        body: noteBody,
      },
    });
    setModBusy(false);

    if (!res.ok) {
      setModResult(null);
      setModError(res.error);
      return;
    }

    setModResult(res.moderation);
  }

  const signoff = f.from.trim() || "Anonymous";

  const letter = [
    `To ${f.toName || "you"},`,
    f.message,
    f.feel && `What I was feeling:\n${f.feel}`,
    f.view && `How I saw the situation:\n${f.view}`,
    f.forward && `How I'd like to move forward:\n${f.forward}`,
    f.gift && `A little something for you: ${f.gift}`,
    `Warmly,\n${signoff}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const ready = f.to.includes("@") && (f.message.trim() || f.feel.trim());
  const mailto = `mailto:${encodeURIComponent(f.to)}?subject=${encodeURIComponent("A note for you, sent through Olive")}&body=${encodeURIComponent(letter)}`;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-12">
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">Reach Out</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Taking the first step is brave. You can sign your name or stay anonymous.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTutorial(true)}
          className="self-start gap-2 rounded-lg border-navy/25 text-xs font-bold text-navy hover:bg-navy/5 sm:self-center"
        >
          <BookOpen className="h-4 w-4" />
          <span>How to use Reach Out</span>
        </Button>
      </div>

      {/* Pop-up Tutorial & In-Person Disclaimer Dialog */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[var(--radius)] border border-border bg-card p-6 sm:p-8 shadow-soft">
          <DialogHeader className="pr-8">
            <div className="flex items-center gap-2.5 text-navy">
              <BookOpen className="h-5 w-5" />
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                How to Use Reach Out
              </DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-sm text-muted-foreground">
              4 quick steps to write a thoughtful note — click the X in the corner anytime to start
              writing.
            </DialogDescription>
          </DialogHeader>

          {/* Tutorial Steps First */}
          <ol className="mt-2 grid gap-3 sm:grid-cols-2">
            {tutorialSteps.map((item) => (
              <li
                key={item.step}
                className="flex flex-col rounded-xl border border-border/80 bg-muted/30 p-4"
              >
                <span className="text-xs font-bold text-navy tabular-nums">Step {item.step}</span>
                <h3 className="mt-1 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ol>

          {/* Disclaimer After How to Use */}
          <aside
            aria-label="In-person conflict disclaimer"
            className="mt-2 flex items-start gap-3.5 rounded-xl border border-navy/25 bg-navy/[0.04] p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy/20 bg-card text-navy">
              <Users className="h-4 w-4" />
            </div>
            <div className="text-sm leading-relaxed">
              <p className="font-bold text-foreground">
                It might be best to solve certain conflicts in person.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Notes are great for breaking the ice or organizing your thoughts calmly, but tone
                and body language matter—if it feels safe and both of you are ready, a face-to-face
                talk can clear up misunderstandings faster.
              </p>
            </div>
          </aside>
        </DialogContent>
      </Dialog>

      {/* Allow Sentence Starters Control Banner */}
      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy/20 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy/25 bg-navy/10 text-navy shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">Need help finding the right words?</p>
            <p className="text-xs text-muted-foreground">
              Turn on sentence starters to get kind suggestions for apologizing, explaining your
              feelings, and resetting.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={allowStarters ? "default" : "outline"}
          onClick={toggleStarters}
          className={`rounded-full gap-2 text-xs font-bold transition-all ${
            allowStarters
              ? "bg-navy hover:bg-navy/90 text-navy-foreground shadow-xs"
              : "border-navy/30 text-navy hover:bg-navy/10"
          }`}
        >
          {allowStarters ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          <span>{allowStarters ? "Sentence Starters: Allowed" : "Allow sentence starters"}</span>
        </Button>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Left Column: Contact & Message */}
        <div className="space-y-5 rounded-[var(--radius)] bg-card p-6 shadow-soft border border-border">
          <h2 className="text-2xl font-bold">Contact & Opening</h2>
          <label className="block font-bold">
            Who are you in a conflict with?
            <Input
              className="mt-2 font-normal"
              placeholder="Ex. John Doe"
              value={f.toName}
              onChange={set("toName")}
            />
          </label>

          <label className="block font-bold">
            What's their email?
            <Input
              className="mt-2 font-normal"
              type="email"
              placeholder="Ex. johndoe@email.com"
              value={f.to}
              onChange={set("to")}
            />
          </label>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="block font-bold">What do you want to say to them?</label>
              {!allowStarters && (
                <button
                  type="button"
                  onClick={toggleStarters}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Allow sentence starters
                </button>
              )}
            </div>

            {allowStarters && (
              <div className="mt-2 mb-2 rounded-xl bg-muted/40 p-3 border border-border/70">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-primary" />
                  <span>Click to insert a sentence starter:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {messageStarters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addStarter("message", s)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-secondary hover:border-primary/40 hover:text-primary shadow-2xs text-left"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              rows={5}
              className="mt-2 font-normal"
              placeholder="Write your personal message or click a starter above..."
              value={f.message}
              onChange={set("message")}
            />
          </div>

          <label className="block font-bold">
            Sign it (leave empty to stay anonymous)
            <Input
              className="mt-2 font-normal"
              placeholder="Anonymous / your name"
              value={f.from}
              onChange={set("from")}
            />
          </label>
        </div>

        {/* Right Column: Gift & Details */}
        <div className="space-y-5 rounded-[var(--radius)] bg-card p-6 shadow-soft border border-border">
          <div>
            <p className="font-bold">Choose your gift (optional)</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Gift cards
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {giftCards.map((g) => (
                <GiftChip
                  key={g}
                  label={g}
                  active={f.gift === g}
                  onClick={() => setF({ ...f, gift: f.gift === g ? "" : g })}
                />
              ))}
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Kind gestures
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {gestures.map((g) => (
                <GiftChip
                  key={g}
                  label={g}
                  active={f.gift === g}
                  onClick={() => setF({ ...f, gift: f.gift === g ? "" : g })}
                />
              ))}
            </div>
          </div>

          {/* Feel field with starters */}
          <div>
            <label className="block font-bold">What were you feeling?</label>
            {allowStarters && (
              <div className="mt-2 mb-2 rounded-xl bg-muted/40 p-3 border border-border/70">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Sentence starters:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {feelStarters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addStarter("feel", s)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-secondary hover:border-primary/40 hover:text-primary shadow-2xs text-left"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              rows={2}
              className="mt-2 font-normal"
              placeholder="I felt… because…"
              value={f.feel}
              onChange={set("feel")}
            />
          </div>

          {/* View field with starters */}
          <div>
            <label className="block font-bold">How did you see the situation?</label>
            {allowStarters && (
              <div className="mt-2 mb-2 rounded-xl bg-muted/40 p-3 border border-border/70">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Sentence starters:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {viewStarters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addStarter("view", s)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-secondary hover:border-primary/40 hover:text-primary shadow-2xs text-left"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              rows={2}
              className="mt-2 font-normal"
              placeholder="I thought… I noticed…"
              value={f.view}
              onChange={set("view")}
            />
          </div>

          {/* Forward field with starters */}
          <div>
            <label className="block font-bold">How would you like to move forward?</label>
            {allowStarters && (
              <div className="mt-2 mb-2 rounded-xl bg-muted/40 p-3 border border-border/70">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <HeartHandshake className="h-3 w-3 text-primary" />
                  <span>Sentence starters:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {forwardStarters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addStarter("forward", s)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-secondary hover:border-primary/40 hover:text-primary shadow-2xs text-left"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              rows={2}
              className="mt-2 font-normal"
              placeholder="I'd like us to…"
              value={f.forward}
              onChange={set("forward")}
            />
          </div>
        </div>
      </div>

      {/* Note Preview Section */}
      <div className="mt-8 rounded-[var(--radius)] border border-border bg-card/90 p-8 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            Your note preview
          </p>
          <span className="text-xs text-muted-foreground">Updates live as you type</span>
        </div>
        <pre className="mt-4 whitespace-pre-wrap font-display text-lg leading-relaxed text-foreground">
          {letter}
        </pre>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild={!!ready} disabled={!ready} className="rounded-full" size="lg">
            {ready ? (
              <a href={mailto}>Send my note</a>
            ) : (
              <span>Add their email and a message to send</span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={modBusy}
            onClick={runReachOutSafetyCheck}
            className="gap-2 rounded-full text-sm font-bold"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{modBusy ? "Checking tone & safety…" : "AI Tone & Safety Check"}</span>
          </Button>
        </div>

        <div className="mt-4">
          <AiModeratorFeedback
            result={modResult}
            error={modError}
            onApplyRewrite={(rewrite) => {
              setF((prev) => ({
                ...prev,
                message: rewrite,
                feel: "",
                view: "",
                forward: "",
              }));
              setModResult(null);
              setModError(null);
              toast.success("Updated your note with calmer wording.");
            }}
            onDismiss={() => {
              setModResult(null);
              setModError(null);
            }}
          />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          This opens your email app. Gift cards are bought separately — the note just lets them
          know.
        </p>
      </div>
    </main>
  );
}

function GiftChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-2xs"
          : "border-border bg-secondary text-secondary-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
