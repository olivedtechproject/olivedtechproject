export type TopicCategory =
  "All" | "Sibling Conflicts" | "Arguments & Hurt" | "Stress & School" | "Friends & Social";

export type EmotionCategory =
  | "All"
  | "Angry & Frustrated"
  | "Hurt & Left Out"
  | "Stressed & Overwhelmed"
  | "Anxious & Overthinking"
  | "Embarrassed";

export type SortMode = "recommended" | "popular" | "highest-rated";

export interface CalmScenario {
  id: string;
  title: string;
  category: Exclude<TopicCategory, "All">;
  emotions: Exclude<EmotionCategory, "All">[];
  short: string;
  tips: string[];
}

export interface CommunityTip {
  id: string;
  nickname: string;
  title: string;
  body: string;
  category?: Exclude<TopicCategory, "All">;
  emotions?: Exclude<EmotionCategory, "All">[];
}

export interface RatingStats {
  average: number;
  count: number;
  userRating: number | null;
  popularityScore: number;
}

export type UserRatingsMap = Record<string, number>;

export const TOPIC_CATEGORIES: TopicCategory[] = [
  "All",
  "Sibling Conflicts",
  "Arguments & Hurt",
  "Stress & School",
  "Friends & Social",
];

export const EMOTION_CATEGORIES: EmotionCategory[] = [
  "All",
  "Angry & Frustrated",
  "Hurt & Left Out",
  "Stressed & Overwhelmed",
  "Anxious & Overthinking",
  "Embarrassed",
];

export const CALM_SCENARIOS: CalmScenario[] = [
  {
    id: "scenario-sibling-boundaries",
    title: "Sibling crossed your boundaries or took your stuff?",
    category: "Sibling Conflicts",
    emotions: ["Angry & Frustrated", "Hurt & Left Out"],
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
    id: "scenario-sibling-buttons",
    title: "Sibling knows how to push your buttons and won't stop?",
    category: "Sibling Conflicts",
    emotions: ["Angry & Frustrated", "Stressed & Overwhelmed"],
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
    id: "scenario-sibling-shouting",
    title: "Furious after a heated shouting match with a brother or sister?",
    category: "Sibling Conflicts",
    emotions: ["Angry & Frustrated"],
    short: "Living under one roof makes fights feel intense. Hit the emergency reset button first.",
    tips: [
      "Splash cold water on your wrists and face — it triggers your dive reflex to immediately slow down a racing pulse",
      "Agree on a 20-minute 'truce cooldown': neither of you speaks until you've both had time to decompress",
      "Vent uncensored in a notes app or on paper, then delete or shred it once your body relaxes",
      "When ready to repair: 'I was really mad and shouldn't have yelled, but I want things to be okay between us. Can we reset?'",
    ],
  },
  {
    id: "scenario-sibling-parents",
    title: "Feeling like parents always take your sibling's side?",
    category: "Sibling Conflicts",
    emotions: ["Hurt & Left Out", "Angry & Frustrated"],
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
    id: "scenario-stress-work",
    title: "Stressed about work and can't focus?",
    category: "Stress & School",
    emotions: ["Stressed & Overwhelmed", "Anxious & Overthinking"],
    short: "Take a 5 minute break. Go to your room and lie down with the lights off.",
    tips: [
      "Put on calm music and close your eyes",
      "Breathe in for 4, hold for 4, out for 4 — five times",
      "Write a tiny to-do list: just the next 3 things",
      "Get a glass of water and stretch",
    ],
  },
  {
    id: "scenario-argument-angry-sad",
    title: "Just had an argument and feel angry or sad?",
    category: "Arguments & Hurt",
    emotions: ["Angry & Frustrated", "Hurt & Left Out"],
    short: "Distance yourself from the person. Taking a break can help you clear your head.",
    tips: [
      "Go for a fast walk outside",
      "Squeeze a pillow hard, then let go slowly",
      "Write everything down — you don't have to send it",
      "Ask yourself: how might they see it?",
    ],
  },
  {
    id: "scenario-friends-left-out",
    title: "Feeling left out by your friends?",
    category: "Friends & Social",
    emotions: ["Hurt & Left Out"],
    short: "Your feelings make sense. Do something that reminds you you matter.",
    tips: [
      "Text someone who always makes you laugh",
      "List 3 things you like about yourself",
      "Do a hobby you love for 15 minutes",
      "Tell a trusted adult how you feel",
    ],
  },
  {
    id: "scenario-embarrassed-said",
    title: "Embarrassed about something you said?",
    category: "Friends & Social",
    emotions: ["Embarrassed", "Anxious & Overthinking"],
    short: "Everyone says things they wish they hadn't. It feels huge now but it will shrink.",
    tips: [
      "Dance it out to a loud song",
      "Remind yourself: most people forget fast",
      "Plan one simple sentence to fix it",
      "Wrap up in a blanket with a warm drink",
    ],
  },
  {
    id: "scenario-embarrassed-temper",
    title: "Embarrassed after losing your temper in front of others?",
    category: "Arguments & Hurt",
    emotions: ["Embarrassed", "Angry & Frustrated"],
    short:
      "Snapping publicly leaves an awkward hangover. Give yourself grace, then own the moment simply.",
    tips: [
      "Step out to wash your face and let the adrenaline drop for 10 minutes",
      "Remember that one tense reaction does not define your whole character",
      "Keep any follow-up brief and honest: 'Hey, I got overwhelmed earlier and shouldn't have snapped'",
      "Move forward without over-apologizing ten times — most people respect a calm, sincere reset",
    ],
  },
  {
    id: "scenario-night-overthinking",
    title: "Can't stop thinking about it at night?",
    category: "Stress & School",
    emotions: ["Anxious & Overthinking", "Stressed & Overwhelmed"],
    short: "Get the thoughts out of your head and onto paper.",
    tips: [
      "Journal for 5 minutes, then close the book",
      "Listen to a sleep story or rain sounds",
      "Tense and relax each muscle, toes to head",
      "Put your phone across the room",
    ],
  },
  {
    id: "scenario-hurt-family",
    title: "Feeling hurt by a family member?",
    category: "Arguments & Hurt",
    emotions: ["Hurt & Left Out"],
    short: "Give yourself space first, talk later when you're calm.",
    tips: [
      "Take a shower or wash your face",
      "Draw what the feeling looks like",
      "Talk to someone you trust",
      "Write what you want them to understand",
    ],
  },
];

const RATINGS_STORAGE_KEY = "olive-calm-star-ratings-v1";
const TIP_META_STORAGE_KEY = "olive-calm-tip-meta-v1";

export function loadUserCalmRatings(): UserRatingsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RATINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const cleaned: UserRatingsMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && v >= 1 && v <= 5) {
        cleaned[k] = Math.round(v);
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

export function saveUserCalmRatings(ratings: UserRatingsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    // ignore storage errors
  }
}

export interface StoredTipMeta {
  category: Exclude<TopicCategory, "All">;
  emotion: Exclude<EmotionCategory, "All">;
}

export function saveSubmittedTipMeta(title: string, meta: StoredTipMeta): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(TIP_META_STORAGE_KEY);
    const map: Record<string, StoredTipMeta> = raw ? JSON.parse(raw) : {};
    map[title.trim().toLowerCase()] = meta;
    window.localStorage.setItem(TIP_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function loadSubmittedTipMeta(title: string): StoredTipMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TIP_META_STORAGE_KEY);
    if (!raw) return null;
    const map: Record<string, StoredTipMeta> = JSON.parse(raw);
    return map[title.trim().toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

export function classifyCommunityTip(
  title: string,
  body: string,
): {
  category: Exclude<TopicCategory, "All">;
  emotions: Exclude<EmotionCategory, "All">[];
} {
  const stored = loadSubmittedTipMeta(title);
  if (stored) {
    return {
      category: stored.category,
      emotions: [stored.emotion],
    };
  }

  const text = `${title} ${body}`.toLowerCase();

  let category: Exclude<TopicCategory, "All"> = "Arguments & Hurt";
  if (/\b(sibling\w*|brother\w*|sister\w*|room|parents?)\b/.test(text)) {
    category = "Sibling Conflicts";
  } else if (/\b(exams?|school|study\w*|homework|tests?|class\w*|grades?|sleep)\b/.test(text)) {
    category = "Stress & School";
  } else if (/\b(friends?|birthday|texts?|group chat|popular|embarrass\w*)\b/.test(text)) {
    category = "Friends & Social";
  }

  const emotions = new Set<Exclude<EmotionCategory, "All">>();
  if (
    /\b(angry|mad|furious|annoy\w*|bother\w*|teas\w*|shout\w*|yell\w*|frustrat\w*|irritat\w*)\b/.test(
      text,
    )
  ) {
    emotions.add("Angry & Frustrated");
  }
  if (/\b(hurt\w*|sad\w*|left out|forgot|alone|cry\w*|unfair|ignor\w*)\b/.test(text)) {
    emotions.add("Hurt & Left Out");
  }
  if (/\b(overwhelm\w*|stress\w*|exams?|focus|pressure|tired|breathe|cold)\b/.test(text)) {
    emotions.add("Stressed & Overwhelmed");
  }
  if (/\b(overthink\w*|worr\w*|night|anxious|nervous|text message|brain)\b/.test(text)) {
    emotions.add("Anxious & Overthinking");
  }
  if (/\b(embarrass\w*|awkward|cring\w*|shame|blush\w*)\b/.test(text)) {
    emotions.add("Embarrassed");
  }

  if (emotions.size === 0) {
    emotions.add("Stressed & Overwhelmed");
  }

  return {
    category,
    emotions: Array.from(emotions),
  };
}

/**
 * Computes usefulness rating stats from real recorded ratings (no fake baseline numbers).
 * Returns 0 average, 0 count, and 0 popularityScore when an item has no ratings yet.
 */
export function computeRatingStats(
  id: string,
  userRatings: UserRatingsMap,
  recordedSum = 0,
  recordedCount = 0,
): RatingStats {
  const userRating = userRatings[id] ?? null;
  const totalSum = recordedSum + (userRating ?? 0);
  const count = recordedCount + (userRating !== null ? 1 : 0);
  const average = count > 0 ? Number((totalSum / count).toFixed(1)) : 0;

  if (count === 0) {
    return {
      average: 0,
      count: 0,
      userRating: null,
      popularityScore: 0,
    };
  }

  const popularityScore = Number((average * 15 + Math.log2(count + 1) * 3.5).toFixed(3));

  return {
    average,
    count,
    userRating,
    popularityScore,
  };
}

export interface RatedItem<T> {
  item: T;
  stats: RatingStats;
}

export function filterAndSortItems<
  T extends {
    id: string;
    category: Exclude<TopicCategory, "All">;
    emotions: Exclude<EmotionCategory, "All">[];
    recordedRatingSum?: number;
    recordedRatingCount?: number;
  },
>(
  items: T[],
  topic: TopicCategory,
  emotion: EmotionCategory,
  sortMode: SortMode,
  userRatings: UserRatingsMap,
): RatedItem<T>[] {
  const filtered = items.filter((item) => {
    const matchesTopic = topic === "All" || item.category === topic;
    const matchesEmotion = emotion === "All" || item.emotions.includes(emotion);
    return matchesTopic && matchesEmotion;
  });

  const withStats = filtered.map((item) => ({
    item,
    stats: computeRatingStats(
      item.id,
      userRatings,
      item.recordedRatingSum ?? 0,
      item.recordedRatingCount ?? 0,
    ),
  }));

  if (sortMode === "popular") {
    return [...withStats].sort((a, b) => {
      if (b.stats.popularityScore !== a.stats.popularityScore) {
        return b.stats.popularityScore - a.stats.popularityScore;
      }
      return b.stats.count - a.stats.count;
    });
  }

  if (sortMode === "highest-rated") {
    return [...withStats].sort((a, b) => {
      if (b.stats.average !== a.stats.average) {
        return b.stats.average - a.stats.average;
      }
      return b.stats.count - a.stats.count;
    });
  }

  return withStats;
}
