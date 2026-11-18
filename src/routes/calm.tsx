import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Dices,
  Flame,
  Headphones,
  Lock,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Star,
  TrendingUp,
  Users2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateRandomNickname } from "@/lib/nicknameGenerator";
import { useAccountSession } from "@/lib/accountAuth";
import { AiModeratorFeedback } from "@/components/AiModeratorFeedback";
import { moderateWithAI, screenNoHumanNames, type AiModerationResult } from "@/lib/aiModerator";
import { detectHumanNames } from "@/lib/humanNameModeration";
import {
  CALM_SCENARIOS,
  EMOTION_CATEGORIES,
  TOPIC_CATEGORIES,
  classifyCommunityTip,
  filterAndSortItems,
  loadUserCalmRatings,
  saveSubmittedTipMeta,
  saveUserCalmRatings,
  type CalmScenario,
  type EmotionCategory,
  type SortMode,
  type TopicCategory,
  type UserRatingsMap,
} from "@/lib/calmTips";

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

const scenarioIcons: Record<string, typeof Users2> = {
  "scenario-sibling-boundaries": ShieldAlert,
  "scenario-sibling-buttons": Headphones,
  "scenario-sibling-shouting": Flame,
  "scenario-sibling-parents": Scale,
};

const siblingStarters = [
  "Sibling took my stuff without asking",
  "Constant arguing over shared bedroom",
  "Sibling won't stop teasing me",
  "Parents always take my sibling's side",
];

type UnifiedSuggestion =
  | (CalmScenario & { kind: "scenario" })
  | {
      kind: "community";
      id: string;
      nickname: string;
      title: string;
      body: string;
      category: Exclude<TopicCategory, "All">;
      emotions: Exclude<EmotionCategory, "All">[];
    };

function StarRatingBar({
  itemId,
  average,
  count,
  userRating,
  onRate,
}: {
  itemId: string;
  average: number;
  count: number;
  userRating: number | null;
  onRate: (id: string, stars: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayStars = hovered ?? userRating ?? (count > 0 ? Math.round(average) : 0);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {userRating ? `You rated ${userRating}/5` : "Was this useful?"}
        </span>
        <div
          role="group"
          aria-label="Rate how useful this suggestion was from 1 to 5 stars"
          className="flex items-center gap-0.5"
          onMouseLeave={() => setHovered(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= displayStars;
            const isUserSelected = userRating !== null && star <= userRating;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onClick={() => onRate(itemId, star)}
                aria-label={`Rate ${star} out of 5 stars`}
                aria-pressed={userRating === star}
                title={
                  userRating === star
                    ? `Click to remove your ${star}-star rating`
                    : `Rate ${star} out of 5 stars`
                }
                className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    hovered !== null
                      ? star <= hovered
                        ? "fill-amber-400 text-amber-500"
                        : "text-muted-foreground/40"
                      : isUserSelected
                        ? "fill-amber-400 text-amber-500"
                        : filled
                          ? "fill-amber-300/60 text-amber-500/80"
                          : "text-muted-foreground/40"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
        {count > 0 ? (
          <>
            <span className="font-bold text-foreground">{average.toFixed(1)}</span>
            <span>/ 5</span>
            <span aria-hidden="true">·</span>
            <span>
              {count} {count === 1 ? "rating" : "ratings"}
            </span>
          </>
        ) : (
          <span>No ratings yet</span>
        )}
      </div>
    </div>
  );
}

function Calm() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory>("All");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionCategory>("All");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [userRatings, setUserRatings] = useState<UserRatingsMap>(() => loadUserCalmRatings());

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

  const handleRate = (id: string, stars: number) => {
    setUserRatings((prev) => {
      const next = { ...prev };
      if (next[id] === stars) {
        delete next[id];
        saveUserCalmRatings(next);
        toast.info("Rating cleared");
      } else {
        next[id] = stars;
        saveUserCalmRatings(next);
        toast.success(`Rated ${stars}/5 stars — thanks for ranking what helped!`);
      }
      return next;
    });
  };

  const allSuggestions: UnifiedSuggestion[] = useMemo(() => {
    const curated: UnifiedSuggestion[] = CALM_SCENARIOS.map((s) => ({
      ...s,
      kind: "scenario" as const,
    }));

    const community: UnifiedSuggestion[] = tips.map((t) => {
      const classified = classifyCommunityTip(t.title, t.body);
      return {
        kind: "community" as const,
        id: `tip-${t.id}`,
        nickname: t.nickname,
        title: t.title,
        body: t.body,
        category: classified.category,
        emotions: classified.emotions,
      };
    });

    return [...curated, ...community];
  }, [tips]);

  const rankedSuggestions = useMemo(
    () => filterAndSortItems(allSuggestions, selectedTopic, selectedEmotion, sortMode, userRatings),
    [allSuggestions, selectedTopic, selectedEmotion, sortMode, userRatings],
  );

  const siblingCount = CALM_SCENARIOS.filter((s) => s.category === "Sibling Conflicts").length;
  const hasActiveFilters = selectedTopic !== "All" || selectedEmotion !== "All";

  const resetFilters = () => {
    setSelectedTopic("All");
    setSelectedEmotion("All");
    setOpenId(null);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 pb-12">
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">Cool Down</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse calming strategies by emotion, topic, or community popularity—and rate how useful
            each tip was.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-[var(--radius)] border-2 border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold underline decoration-primary underline-offset-8">
            Tips and Tricks
          </h2>
          <p className="text-xs font-semibold text-muted-foreground tabular-nums">
            Showing {rankedSuggestions.length} of {allSuggestions.length} suggestions
          </p>
        </div>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Whether you&apos;re dealing with sibling drama at home, school pressure, or an argument
          with a friend, filter by how you feel right now or see what teens rated most helpful.
        </p>

        {/* Browse by Emotion */}
        <div className="mt-6 border-t border-border/70 pt-5">
          <p className="mb-2.5 text-xs font-bold text-muted-foreground">Browse by Emotion</p>
          <div className="flex flex-wrap items-center gap-2">
            {EMOTION_CATEGORIES.map((emotion) => {
              const isSelected = selectedEmotion === emotion;
              return (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => {
                    setSelectedEmotion(emotion);
                    setOpenId(null);
                  }}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-navy text-navy-foreground shadow-xs ring-2 ring-navy/25"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  <span>{emotion === "All" ? "All Emotions" : emotion}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browse by Topic */}
        <div className="mt-5 border-t border-border/50 pt-4">
          <p className="mb-2.5 text-xs font-bold text-muted-foreground">Browse by Topic</p>
          <div className="flex flex-wrap items-center gap-2">
            {TOPIC_CATEGORIES.map((cat) => {
              const isSelected = selectedTopic === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(cat);
                    setOpenId(null);
                  }}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/25"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {cat === "Sibling Conflicts" && <Users2 className="h-3.5 w-3.5" />}
                  <span>{cat === "All" ? "All Topics" : cat}</span>
                  {cat === "Sibling Conflicts" && (
                    <span className="tabular-nums opacity-80">({siblingCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Browse by Popularity / Sort Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold text-muted-foreground">Sort by</span>
            <button
              type="button"
              onClick={() => setSortMode("popular")}
              aria-pressed={sortMode === "popular"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                sortMode === "popular"
                  ? "bg-navy text-navy-foreground shadow-xs"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Most Popular</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode("highest-rated")}
              aria-pressed={sortMode === "highest-rated"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                sortMode === "highest-rated"
                  ? "bg-navy text-navy-foreground shadow-xs"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              <span>Highest Rated (5★)</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode("recommended")}
              aria-pressed={sortMode === "recommended"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                sortMode === "recommended"
                  ? "bg-navy text-navy-foreground shadow-xs"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <span>Recommended</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </section>

      <p className="mt-8 text-center text-sm font-semibold text-muted-foreground">
        Click any scenario to read action steps, and rate 1–5 stars to help surface what worked best
      </p>

      {/* Empty Filter State */}
      {rankedSuggestions.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius)] border border-border bg-card p-10 text-center shadow-soft">
          <p className="text-lg font-bold text-foreground">
            No suggestions match that exact topic and emotion combination yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try clearing one filter or share your own tip below to help others in this situation.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="mt-5 rounded-lg"
          >
            Show all suggestions
          </Button>
        </div>
      ) : (
        /* Suggestions Grid */
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {rankedSuggestions.map(({ item, stats }, index) => {
            const isSibling = item.category === "Sibling Conflicts";
            const showRank =
              (sortMode === "popular" || sortMode === "highest-rated") && stats.count > 0;

            if (item.kind === "scenario") {
              const isOpen = openId === item.id;
              const Icon = scenarioIcons[item.id];
              return (
                <article
                  key={item.id}
                  className={`flex flex-col justify-between rounded-[var(--radius)] border p-6 transition-all ${
                    isSibling
                      ? "border-navy/25 bg-card/95 shadow-soft"
                      : "border-border bg-card/90 shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold">
                        {showRank && (
                          <>
                            <span className="font-bold text-navy tabular-nums">#{index + 1}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isSibling ? "text-navy" : "text-foreground/80"
                          }`}
                        >
                          {Icon && <Icon className="h-3.5 w-3.5" />}
                          <span>{item.category}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.emotions.join(", ")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="mt-2.5 w-full text-left group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy rounded-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-navy transition-colors">
                          {item.title}
                        </h3>
                        <ChevronDown
                          className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180 text-navy" : ""
                          }`}
                        />
                      </div>

                      <p className="mt-3 border-t border-border pt-3 text-sm font-medium leading-relaxed text-foreground/90">
                        – {item.short}
                      </p>

                      {isOpen && (
                        <ul className="mt-4 space-y-2 border-t border-border/60 pt-3">
                          {item.tips.map((t) => (
                            <li
                              key={t}
                              className="flex items-start gap-2 text-sm text-foreground/90"
                            >
                              <span className="font-bold text-primary">•</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  </div>

                  <StarRatingBar
                    itemId={item.id}
                    average={stats.average}
                    count={stats.count}
                    userRating={stats.userRating}
                    onRate={handleRate}
                  />
                </article>
              );
            }

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-[var(--radius)] border border-border bg-secondary/50 p-6 shadow-2xs"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    {showRank && (
                      <>
                        <span className="font-bold text-navy tabular-nums">#{index + 1}</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-bold text-primary">Community Tip</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.emotions.join(", ")}</span>
                  </div>
                  <h3 className="mt-2.5 text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm leading-relaxed text-foreground/90">
                    – {item.body}
                  </p>
                  <p className="mt-3 text-xs font-bold text-primary">Shared by {item.nickname}</p>
                </div>

                <StarRatingBar
                  itemId={item.id}
                  average={stats.average}
                  count={stats.count}
                  userRating={stats.userRating}
                  onRate={handleRate}
                />
              </article>
            );
          })}
        </div>
      )}

      <MakeYourOwn />
    </main>
  );
}

function MakeYourOwn() {
  const { assignedUsername } = useAccountSession();
  const [nickname, setNickname] = useState(() => generateRandomNickname());
  const activeNick = assignedUsername ?? nickname;
  const [f, setF] = useState({ title: "", body: "" });
  const [topic, setTopic] = useState<Exclude<TopicCategory, "All">>("Sibling Conflicts");
  const [emotion, setEmotion] = useState<Exclude<EmotionCategory, "All">>("Angry & Frustrated");
  const [busy, setBusy] = useState(false);
  const [modBusy, setModBusy] = useState(false);
  const [modResult, setModResult] = useState<AiModerationResult | null>(null);
  const [modError, setModError] = useState<string | null>(null);
  const [approvedSignature, setApprovedSignature] = useState<string | null>(null);

  const currentSignature = `${f.title.trim()}::${f.body.trim()}`;

  async function runTipSafetyCheck(): Promise<boolean> {
    if (f.title.trim().length < 3 || f.body.trim().length < 5) {
      toast.error("Fill in the situation and your tip first.");
      return false;
    }
    setModBusy(true);
    setModError(null);
    const res = await moderateWithAI({
      data: {
        contentType: "tip",
        title: f.title.trim(),
        body: f.body.trim(),
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
      setApprovedSignature(currentSignature);
      return true;
    }

    setApprovedSignature(null);
    return false;
  }

  async function insertTip() {
    const nameCheck = screenNoHumanNames({
      contentType: "tip",
      title: f.title.trim(),
      body: f.body.trim(),
    });
    if (nameCheck) {
      setModResult(nameCheck);
      setModError(null);
      setApprovedSignature(null);
      toast.error("Please remove real human names before sharing your tip.");
      return;
    }

    const submittingNick = assignedUsername ?? (nickname.trim() || generateRandomNickname());
    setBusy(true);
    const { error } = await supabase.from("tips").insert({
      nickname: submittingNick,
      title: f.title.trim(),
      body: f.body.trim(),
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send. Try again.");
      return;
    }

    saveSubmittedTipMeta(f.title.trim(), { category: topic, emotion });
    setF({ title: "", body: "" });
    setModResult(null);
    setModError(null);
    setApprovedSignature(null);

    if (assignedUsername) {
      toast.success("Thanks! A moderator will check your tip before it shows up.", {
        description: `Shared under your permanent account name "${assignedUsername}".`,
      });
    } else {
      const nextNick = generateRandomNickname();
      setNickname(nextNick);
      toast.success("Thanks! A moderator will check your tip before it shows up.", {
        description: `Posted as "${submittingNick}". Rolled new nickname ("${nextNick}") for your next tip!`,
      });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 3 || f.body.trim().length < 5) {
      toast.error("Fill in the situation and your tip.");
      return;
    }

    if (approvedSignature !== currentSignature) {
      const passed = await runTipSafetyCheck();
      if (!passed) return;
    }

    await insertTip();
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

      {/* Locked Account Username or Guest Random Nickname Display */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/20 bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy/25 bg-navy/10 text-navy shadow-2xs">
            {assignedUsername ? <Lock className="h-5 w-5" /> : <Dices className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {assignedUsername
                ? "Sharing with your permanent account name (locked)"
                : "Sharing as guest"}
            </p>
            <p className="font-display text-lg font-bold text-foreground">{activeNick}</p>
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
                setNickname(fresh);
                toast.info(`Rolled new nickname: ${fresh}`);
              }}
              className="gap-1.5 rounded-lg text-xs font-semibold transition-colors hover:border-navy hover:text-navy"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">Which emotion fits best?</p>
          <div className="flex flex-wrap gap-1.5">
            {EMOTION_CATEGORIES.filter(
              (em): em is Exclude<EmotionCategory, "All"> => em !== "All",
            ).map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmotion(em)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  emotion === em
                    ? "bg-navy text-navy-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">Topic</p>
          <div className="flex flex-wrap gap-1.5">
            {TOPIC_CATEGORIES.filter((c): c is Exclude<TopicCategory, "All"> => c !== "All").map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTopic(c)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    topic === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-muted-foreground">Quick Situation Ideas:</p>
        <div className="flex flex-wrap gap-2">
          {siblingStarters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => setF((prev) => ({ ...prev, title: starter }))}
              className="rounded-lg border border-border bg-secondary/70 px-3 py-1 text-xs font-semibold transition-colors hover:border-navy/40 hover:bg-secondary"
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
        onChange={(e) => {
          setF({ ...f, title: e.target.value });
          setModResult(null);
          setModError(null);
          setApprovedSignature(null);
        }}
      />
      <Textarea
        rows={6}
        maxLength={2000}
        placeholder="What helps you cool down or handle it?"
        value={f.body}
        onChange={(e) => {
          setF({ ...f, body: e.target.value });
          setModResult(null);
          setModError(null);
          setApprovedSignature(null);
        }}
      />

      <AiModeratorFeedback
        result={modResult}
        error={modError}
        onApplyRewrite={(rewrite) => {
          const cleanTitle = detectHumanNames(f.title).anonymizedText;
          setF((prev) => ({ ...prev, title: cleanTitle, body: rewrite }));
          setModResult(null);
          setModError(null);
          setApprovedSignature(null);
          toast.success("Updated your tip with anonymous wording.");
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
            onClick={insertTip}
            className="rounded-lg text-xs font-bold"
          >
            Submit to human moderator queue anyway
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="submit" disabled={busy || modBusy} className="rounded-lg">
            {modBusy ? "Checking safety…" : "Share my tip"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || modBusy}
            onClick={runTipSafetyCheck}
            className="gap-1.5 rounded-lg text-xs font-bold"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>{modBusy ? "Scanning…" : "AI Safety Check"}</span>
          </Button>
        </div>
        <span className="text-xs italic text-muted-foreground">
          No real human names allowed ·{" "}
          {assignedUsername
            ? "Your account name stays locked on all tips"
            : "A new guest nickname is rolled every time you share"}
        </span>
      </div>
    </form>
  );
}
