import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Heart,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  UserCircle2,
  Filter,
  Sparkles,
  Eye,
  Shuffle,
  Dices,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAccountAlgorithm, detectStoryContexts } from "@/lib/feedAlgorithm";
import { AlgorithmPreferencesDialog } from "@/components/AlgorithmPreferencesDialog";
import { generateRandomNickname } from "@/lib/nicknameGenerator";
import { useAccountSession } from "@/lib/accountAuth";
import { AiConflictSuggestion } from "@/components/AiConflictSuggestion";
import { AiModeratorFeedback } from "@/components/AiModeratorFeedback";
import { moderateWithAI, screenNoHumanNames, type AiModerationResult } from "@/lib/aiModerator";
import { detectHumanNames } from "@/lib/humanNameModeration";
import { recordUserPostedStory } from "@/lib/userSiteHistory";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Am I in the Wrong? — Olive" },
      {
        name: "description",
        content:
          "Tell your side of a conflict under a nickname and give kind feedback to other teens.",
      },
      { property: "og:title", content: "Am I in the Wrong? — Olive" },
      {
        property: "og:description",
        content:
          "Tell your side of a conflict under a nickname and give kind feedback to other teens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stories,
});

const starters = ["Another perspective:", "Something you could try:", "I've been there:"];

function useReacted() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem("olive-reacted") ?? "[]"));
    } catch {
      setDone([]);
    }
  }, []);

  const toggle = (k: string): boolean => {
    const isPresent = done.includes(k);
    const next = isPresent ? done.filter((item) => item !== k) : [...done, k];
    setDone(next);
    try {
      localStorage.setItem("olive-reacted", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    return !isPresent; // returns true if now added, false if now removed
  };

  return [done, toggle] as const;
}

export type Fb = {
  id: string;
  nickname: string;
  body: string;
  hearts: number;
  upvotes: number;
  downvotes: number;
};
export type Story = {
  id: string;
  nickname: string;
  title: string;
  body: string;
  hearts: number;
  upvotes: number;
  feedback: Fb[];
};

function Stories() {
  const { assignedUsername } = useAccountSession();
  // Guests get a random nickname per post; account holders use their locked assigned username
  const [nick, setNick] = useState(() => generateRandomNickname());
  const activePostNick = assignedUsername ?? nick;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [modBusy, setModBusy] = useState(false);
  const [modResult, setModResult] = useState<AiModerationResult | null>(null);
  const [modError, setModError] = useState<string | null>(null);
  const [modApprovedSignature, setModApprovedSignature] = useState<string | null>(null);

  const algo = useAccountAlgorithm(activePostNick);
  const { checkStoryExclusion } = algo;

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select(
          "id, nickname, title, body, hearts, upvotes, feedback(id, nickname, body, hearts, upvotes, downvotes)",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "feedback", ascending: true });
      if (error) throw error;
      return data as Story[];
    },
  });

  const currentSignature = `${title.trim()}::${body.trim()}`;

  async function runStorySafetyCheck(): Promise<boolean> {
    if (title.trim().length < 3 || body.trim().length < 10) {
      toast.error("Add a title and a bit more about what happened first.");
      return false;
    }
    setModBusy(true);
    setModError(null);
    const res = await moderateWithAI({
      data: {
        contentType: "story",
        title: title.trim(),
        body: body.trim(),
      },
    });
    setModBusy(false);

    if (!res.ok) {
      setModResult(null);
      setModError(res.error);
      return false;
    }

    setModResult(res.moderation);
    if (res.moderation.decision === "approve") {
      setModApprovedSignature(currentSignature);
      return true;
    }

    setModApprovedSignature(null);
    return false;
  }

  async function insertStory() {
    const nameCheck = screenNoHumanNames({
      contentType: "story",
      title: title.trim(),
      body: body.trim(),
    });
    if (nameCheck) {
      setModResult(nameCheck);
      setModError(null);
      setModApprovedSignature(null);
      toast.error("Please remove real human names before posting.");
      return;
    }

    const submittingNick = assignedUsername ?? (nick.trim() || generateRandomNickname());
    setBusy(true);
    const { error } = await supabase.from("stories").insert({
      nickname: submittingNick,
      title: title.trim(),
      body: body.trim(),
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't post. Try again.");
      return;
    }

    recordUserPostedStory(title.trim(), body.trim());

    setTitle("");
    setBody("");
    setModResult(null);
    setModError(null);
    setModApprovedSignature(null);

    if (assignedUsername) {
      toast.success("Sent for moderation!", {
        description: `Posted under your permanent account name "${assignedUsername}".`,
      });
    } else {
      const nextNick = generateRandomNickname();
      setNick(nextNick);
      toast.success("Sent for moderation!", {
        description: `Posted as "${submittingNick}". Rolled a new nickname ("${nextNick}") for your next post!`,
      });
    }
  }

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || body.trim().length < 10) {
      toast.error("Add a title and a bit more about what happened.");
      return;
    }

    if (modApprovedSignature !== currentSignature) {
      const passed = await runStorySafetyCheck();
      if (!passed) return;
    }

    await insertStory();
  }

  // Filter stories through the user's account algorithm preferences
  const visibleStories = stories.filter((s) => !checkStoryExclusion(s).isExcluded);
  const excludedCount = stories.length - visibleStories.length;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-10">
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">Am I in the Wrong?</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Tell what happened and ask: was I fair? Every post receives a fresh anonymous nickname
            for safety and privacy.
          </p>
        </div>
      </div>

      <form
        onSubmit={post}
        className="mt-8 space-y-4 rounded-[var(--radius)] bg-card p-6 shadow-soft border border-border"
      >
        {/* Account Locked Username or Guest Random Nickname Display */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/20 bg-muted/40 p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy/25 bg-navy/10 text-navy shadow-2xs">
              {assignedUsername ? <Lock className="h-5 w-5" /> : <Dices className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {assignedUsername
                  ? "Posting with your permanent account name (locked)"
                  : "Posting as guest"}
              </p>
              <p className="font-display text-lg font-bold text-foreground">{activePostNick}</p>
            </div>
          </div>
          {assignedUsername ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
              <Lock className="h-3.5 w-3.5" />
              <span>Cannot be changed</span>
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const fresh = generateRandomNickname();
                  setNick(fresh);
                  toast.info(`Rolled new nickname: ${fresh}`);
                }}
                className="gap-1.5 rounded-full text-xs font-semibold transition-colors hover:border-navy hover:text-navy"
                title="Roll a different guest nickname"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Roll another name</span>
              </Button>
              <Link to="/account" className="text-xs font-bold text-navy hover:underline">
                Get permanent account name
              </Link>
            </div>
          )}
        </div>

        <Input
          placeholder="AITW for… (one line)"
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setModResult(null);
            setModError(null);
            setModApprovedSignature(null);
          }}
        />
        <Textarea
          placeholder="Tell the story. How did it start? What did you do? How do you feel?"
          rows={5}
          maxLength={4000}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setModResult(null);
            setModError(null);
            setModApprovedSignature(null);
          }}
        />

        {/* AI Safety Moderator Feedback */}
        <AiModeratorFeedback
          result={modResult}
          error={modError}
          onApplyRewrite={(rewrite) => {
            const cleanTitle = detectHumanNames(title).anonymizedText;
            setTitle(cleanTitle);
            setBody(rewrite);
            setModResult(null);
            setModError(null);
            setModApprovedSignature(null);
            toast.success("Updated your story with safer, anonymous wording.");
          }}
          onDismiss={() => {
            setModResult(null);
            setModError(null);
          }}
        />

        {modError && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={insertStory}
              className="rounded-lg text-xs font-bold"
            >
              Submit to human moderator queue anyway
            </Button>
          </div>
        )}

        {/* Optional AI Conflict Suggestion & Emotional Regulation */}
        <AiConflictSuggestion title={title} body={body} nickname={activePostNick} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button type="submit" disabled={busy || modBusy} className="rounded-full">
              {modBusy ? "Checking safety…" : "Send for approval"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || modBusy}
              onClick={runStorySafetyCheck}
              className="gap-1.5 rounded-full text-xs font-bold"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>{modBusy ? "Scanning…" : "AI Safety Check"}</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              No real human names allowed. Screened by AI Moderator &amp; human moderators.
            </span>
          </div>
          <span className="text-[11px] font-medium italic text-muted-foreground">
            {assignedUsername
              ? "Your account name stays locked on all posts"
              : "A new guest nickname is rolled every time you post"}
          </span>
        </div>
      </form>

      {/* Feed Algorithm Controls & Status */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Feed Algorithm</span>
          {excludedCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Filter className="h-3 w-3" />
              {excludedCount} {excludedCount === 1 ? "story" : "stories"} filtered for your account
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Downvoting stories teaches the algorithm to exclude that context from your account
            </span>
          )}
        </div>
        <AlgorithmPreferencesDialog algo={algo} nickname={activePostNick} />
      </div>

      <div className="mt-6 space-y-6">
        {isLoading && <p className="text-muted-foreground">Loading stories…</p>}

        {!isLoading && visibleStories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            {stories.length > 0 && excludedCount === stories.length ? (
              <div className="space-y-3">
                <p className="font-semibold text-foreground">
                  All current stories have been excluded based on your context feedback.
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  You've filtered out contexts that match these stories. You can adjust or reset
                  your excluded topics anytime.
                </p>
                <AlgorithmPreferencesDialog
                  algo={algo}
                  nickname={activePostNick}
                  trigger={
                    <Button variant="default" size="sm" className="rounded-full">
                      Manage Excluded Contexts
                    </Button>
                  }
                />
              </div>
            ) : (
              <p className="text-muted-foreground">
                No approved stories yet. Be the first to share one!
              </p>
            )}
          </div>
        )}

        {visibleStories.map((s) => (
          <StoryCard key={s.id} story={s} algo={algo} assignedUsername={assignedUsername} />
        ))}
      </div>
    </main>
  );
}

function React_({
  icon: Icon,
  count,
  active,
  onClick,
  label,
}: {
  icon: typeof Heart;
  count: number;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={active ? `Remove ${label}` : label}
      aria-pressed={active}
      title={active ? `Click to un-${label.toLowerCase()}` : label}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
          : "bg-secondary text-secondary-foreground hover:bg-accent"
      }`}
    >
      <Icon className={`h-4 w-4 transition-transform ${active ? "fill-current scale-105" : ""}`} />{" "}
      {count}
    </button>
  );
}

function StoryCard({
  story,
  algo,
  assignedUsername,
}: {
  story: Story;
  algo: ReturnType<typeof useAccountAlgorithm>;
  assignedUsername: string | null;
  key?: string;
}) {
  const qc = useQueryClient();
  const [done, toggleReactionKey] = useReacted();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [replyNick, setReplyNick] = useState(() => generateRandomNickname());
  const activeReplyNick = assignedUsername ?? replyNick;
  const [showExcludedFeedback, setShowExcludedFeedback] = useState<Record<string, boolean>>({});
  const [showAiAdvice, setShowAiAdvice] = useState(false);
  const [replyModBusy, setReplyModBusy] = useState(false);
  const [replyModResult, setReplyModResult] = useState<AiModerationResult | null>(null);
  const [replyModError, setReplyModError] = useState<string | null>(null);

  const contexts = detectStoryContexts(story.title, story.body);

  async function toggleReact(
    kind: "heart" | "up",
    target: "story" | "feedback",
    id: string,
    currentCount: number,
  ) {
    const key = `${target}:${kind}:${id}`;
    const isAdding = toggleReactionKey(key);
    const field = kind === "heart" ? "hearts" : "upvotes";
    const table = target === "story" ? "stories" : "feedback";

    if (isAdding) {
      // Trying RPC first
      const { error } = await supabase.rpc("react", { _kind: kind, _target: target, _id: id });
      if (error) {
        // Fallback to direct update if rpc encounters issue
        await supabase
          .from(table)
          .update({ [field]: currentCount + 1 })
          .eq("id", id);
      }
      toast.success(kind === "heart" ? "Hearted!" : "Upvoted!");
    } else {
      // Un-heart or un-upvote: decrement reaction count
      const nextCount = Math.max(0, currentCount - 1);
      const { error } = await supabase
        .from(table)
        .update({ [field]: nextCount })
        .eq("id", id);

      if (error) {
        toast.error("Couldn't remove reaction.");
        // Revert local state
        toggleReactionKey(key);
      } else {
        toast.info(kind === "heart" ? "Heart removed" : "Upvote removed");
      }
    }
    qc.invalidateQueries({ queryKey: ["stories"] });
  }

  // Handle downvoting as algorithmic feedback to exclude context for their account
  function handleDislikeStoryContext() {
    const { excludedContexts, undo } = algo.recordDislikedContext(story);
    const contextList = excludedContexts.join(", ");

    toast.success("Context excluded for your account", {
      description: `Algorithm learned you dislike "${contextList}". Similar contexts will be excluded from your feed.`,
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          toast.info("Context exclusion undone. Story restored to your feed.");
        },
      },
    });
  }

  // Handle feedback context dislike
  function handleDislikeFeedbackContext(f: Fb) {
    const { undo } = algo.recordDislikedFeedback(f, story.title);
    toast.success("Feedback context excluded", {
      description: "Algorithm will avoid this type of feedback on your account.",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          toast.info("Feedback restored.");
        },
      },
    });
  }

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return;

    setReplyModBusy(true);
    setReplyModError(null);
    const mod = await moderateWithAI({
      data: {
        contentType: "reply",
        title: story.title,
        body: text.trim(),
      },
    });
    setReplyModBusy(false);

    if (!mod.ok) {
      setReplyModResult(null);
      setReplyModError(mod.error);
      return;
    }

    setReplyModResult(mod.moderation);
    if (mod.moderation.decision !== "approve") {
      return;
    }

    const submittingReplyNick = assignedUsername ?? (replyNick.trim() || generateRandomNickname());
    const { error } = await supabase.from("feedback").insert({
      story_id: story.id,
      nickname: submittingReplyNick,
      verdict: "both",
      body: text.trim(),
    });
    if (error) {
      toast.error("Couldn't send feedback.");
      return;
    }

    setText("");
    setReplyModResult(null);
    setReplyModError(null);
    if (assignedUsername) {
      toast.success("Feedback sent!", {
        description: `Shared under your permanent account name "${assignedUsername}".`,
      });
    } else {
      const nextReplyNick = generateRandomNickname();
      setReplyNick(nextReplyNick);
      toast.success("Feedback sent!", {
        description: `Shared as "${submittingReplyNick}". Rolled new nickname ("${nextReplyNick}") for next reply.`,
      });
    }
    qc.invalidateQueries({ queryKey: ["stories"] });
  }

  return (
    <article className="rounded-[var(--radius)] border border-border bg-card/90 p-6 shadow-soft transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-primary">
          <UserCircle2 className="h-5 w-5" /> {story.nickname}
        </p>
        <div className="flex flex-wrap gap-1">
          {contexts.map((ctx) => (
            <span
              key={ctx}
              className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground"
            >
              {ctx}
            </span>
          ))}
        </div>
      </div>

      <h2 className="mt-2 text-2xl font-bold">{story.title}</h2>
      <p className="mt-3 whitespace-pre-line text-foreground/90">{story.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground hover:bg-accent transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> {story.feedback.length}
        </button>

        <React_
          icon={Heart}
          label="Heart"
          count={story.hearts}
          active={done.includes(`story:heart:${story.id}`)}
          onClick={() => toggleReact("heart", "story", story.id, story.hearts)}
        />

        <React_
          icon={ArrowBigUp}
          label="Upvote"
          count={story.upvotes}
          active={done.includes(`story:up:${story.id}`)}
          onClick={() => toggleReact("up", "story", story.id, story.upvotes)}
        />

        {/* Algorithm Feedback: Downvote button that excludes context for account */}
        <button
          type="button"
          aria-label="Dislike context - Algorithm feedback"
          title="Don't like this context: Trains algorithm to exclude this context for your account"
          onClick={handleDislikeStoryContext}
          className="group inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
        >
          <ArrowBigDown className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="text-xs">Dislike context</span>
        </button>

        {/* Optional AI Conflict Suggestion button */}
        <button
          type="button"
          onClick={() => setShowAiAdvice(!showAiAdvice)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            showAiAdvice
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          }`}
          title="Get AI conflict resolution & emotional regulation suggestions for this situation"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{showAiAdvice ? "Hide AI Advice" : "AI Conflict Advice"}</span>
        </button>
      </div>

      {showAiAdvice && (
        <div className="mt-4">
          <AiConflictSuggestion
            title={story.title}
            body={story.body}
            nickname={story.nickname}
            defaultExpanded={true}
          />
        </div>
      )}

      {open && (
        <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Kind Opinions ({story.feedback.length})
          </h3>

          {story.feedback.length === 0 && (
            <p className="text-sm italic text-muted-foreground">
              No opinions yet. Be the first to share one below!
            </p>
          )}

          {story.feedback.map((f) => {
            const isExcluded = algo.checkFeedbackExclusion(f.id);
            const isTemporarilyShown = showExcludedFeedback[f.id];

            if (isExcluded && !isTemporarilyShown) {
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span>Feedback hidden based on your algorithm context feedback.</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowExcludedFeedback((prev) => ({ ...prev, [f.id]: true }))}
                      className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> Show
                    </button>
                    <button
                      type="button"
                      onClick={() => algo.restoreFeedback(f.id)}
                      className="font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={f.id} className="rounded-2xl bg-muted/80 p-4 transition-colors">
                <p className="flex items-center gap-1 text-sm font-bold">
                  <UserCircle2 className="h-4 w-4" /> {f.nickname} says:
                </p>
                <p className="mt-1 whitespace-pre-line text-foreground/90">{f.body}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <React_
                    icon={Heart}
                    label="Heart"
                    count={f.hearts}
                    active={done.includes(`feedback:heart:${f.id}`)}
                    onClick={() => toggleReact("heart", "feedback", f.id, f.hearts)}
                  />
                  <React_
                    icon={ArrowBigUp}
                    label="Upvote"
                    count={f.upvotes}
                    active={done.includes(`feedback:up:${f.id}`)}
                    onClick={() => toggleReact("up", "feedback", f.id, f.upvotes)}
                  />

                  {/* Feedback Downvote button converted to Algorithm Context Feedback */}
                  <button
                    type="button"
                    aria-label="Dislike feedback context - Algorithm feedback"
                    title="Don't like this feedback context: Excludes from your algorithm for the future"
                    onClick={() => handleDislikeFeedbackContext(f)}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-secondary-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                  >
                    <ArrowBigDown className="h-3.5 w-3.5" />
                    <span>Dislike context</span>
                  </button>
                </div>
              </div>
            );
          })}

          <form
            onSubmit={reply}
            className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 mt-3"
          >
            {/* Permanent Account Username or Guest Random Reply Nickname */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-navy/15 bg-muted/50 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                {assignedUsername ? (
                  <Lock className="h-3.5 w-3.5 text-navy" />
                ) : (
                  <UserCircle2 className="h-4 w-4 text-primary" />
                )}
                <span className="text-muted-foreground">
                  Replying as:{" "}
                  <strong className="font-display font-bold text-foreground">
                    {activeReplyNick}
                  </strong>
                </span>
              </div>
              {assignedUsername ? (
                <span className="font-semibold text-navy">Permanent name</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const fresh = generateRandomNickname();
                    setReplyNick(fresh);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-navy transition-colors hover:underline"
                  title="Roll another random guest nickname for this reply"
                >
                  <Shuffle className="h-3 w-3" />
                  <span>Roll new</span>
                </button>
              )}
            </div>

            <p className="text-sm font-bold">Sentence starters</p>
            <div className="flex flex-wrap gap-2">
              {starters.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setText(s + " ")}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  {s.replace(":", "")}
                </button>
              ))}
            </div>
            <Textarea
              rows={2}
              maxLength={1500}
              placeholder="Be kind and helpful. What could help them fix it?"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setReplyModResult(null);
                setReplyModError(null);
              }}
            />
            <AiModeratorFeedback
              result={replyModResult}
              error={replyModError}
              onApplyRewrite={(rewrite) => {
                setText(rewrite);
                setReplyModResult(null);
                setReplyModError(null);
                toast.success("Applied safer wording to your reply.");
              }}
              onDismiss={() => {
                setReplyModResult(null);
                setReplyModError(null);
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" disabled={replyModBusy} className="rounded-full">
                {replyModBusy ? "Checking safety…" : "Send feedback"}
              </Button>
              <span className="text-xs text-muted-foreground">
                No real human names allowed · Screened by AI Moderator
              </span>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}
