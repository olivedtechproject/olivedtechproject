import { useState, useEffect, useCallback } from "react";

export interface ContextCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export const KNOWN_CONTEXTS: ContextCategory[] = [
  {
    id: "friends",
    name: "Friendships & Lunch Cliques",
    description: "Issues with close friends, lunch seating, or feeling left out",
    keywords: [
      "friend",
      "best friend",
      "bff",
      "lunch",
      "sit together",
      "table",
      "left out",
      "ignore",
      "ignored",
      "hangout",
      "waving",
    ],
  },
  {
    id: "family",
    name: "Family & Siblings",
    description: "Conflicts with brothers, sisters, parents, or home life",
    keywords: [
      "brother",
      "sister",
      "sibling",
      "mom",
      "dad",
      "parents",
      "mother",
      "father",
      "cousin",
      "family",
      "chores",
      "curfew",
    ],
  },
  {
    id: "privacy",
    name: "Privacy & Personal Boundaries",
    description: "Reading journals, snooping on phones, or violating personal space",
    keywords: [
      "journal",
      "diary",
      "private",
      "privacy",
      "secret",
      "snoop",
      "bedroom",
      "phone",
      "read my",
      "personal space",
    ],
  },
  {
    id: "digital",
    name: "Group Chats & Social Media",
    description: "Online group chats, DM drama, Snapchat, or texting conflicts",
    keywords: [
      "group chat",
      "text",
      "texts",
      "texting",
      "message",
      "snap",
      "snapchat",
      "insta",
      "instagram",
      "post",
      "online",
      "discord",
      "kicked out",
    ],
  },
  {
    id: "school",
    name: "School & Projects",
    description: "Class partners, grades, homework, teachers, or classroom disputes",
    keywords: [
      "school",
      "teacher",
      "homework",
      "project",
      "group project",
      "partner",
      "class",
      "grade",
      "cheat",
      "cheating",
      "presentation",
    ],
  },
  {
    id: "sharing",
    name: "Sharing & Borrowing",
    description: "Lending clothes, borrowing money, damaged or lost items",
    keywords: [
      "borrow",
      "borrowed",
      "lent",
      "lend",
      "clothes",
      "money",
      "pay back",
      "broke",
      "lost my",
      "stolen",
      "belongings",
    ],
  },
  {
    id: "romance",
    name: "Dating & Crushes",
    description: "Crushes, dating, breakups, or romantic tensions",
    keywords: [
      "crush",
      "dating",
      "boyfriend",
      "girlfriend",
      "flirt",
      "broke up",
      "breakup",
      "ex",
      "date",
    ],
  },
  {
    id: "gossip",
    name: "Rumors & Drama",
    description: "Spreading rumors, secrets getting told, or talking behind backs",
    keywords: [
      "rumor",
      "rumours",
      "gossip",
      "behind my back",
      "drama",
      "told everyone",
      "lied",
      "lying",
      "spread",
    ],
  },
];

export interface ExcludedContextLog {
  id: string;
  targetId: string;
  targetType: "story" | "feedback";
  title?: string;
  snippet: string;
  detectedContexts: string[];
  timestamp: number;
}

export interface AccountAlgorithmPreferences {
  excludedStoryIds: string[];
  excludedFeedbackIds: string[];
  excludedContexts: string[]; // names of contexts the user disliked
  log: ExcludedContextLog[];
}

const DEFAULT_PREFERENCES: AccountAlgorithmPreferences = {
  excludedStoryIds: [],
  excludedFeedbackIds: [],
  excludedContexts: [],
  log: [],
};

export function getAccountStorageKey(nickname?: string | null): string {
  const cleanNick = (nickname || "").trim().toLowerCase();
  if (cleanNick) {
    return `olive_feed_algo_${cleanNick}`;
  }
  return "olive_feed_algo_guest";
}

export function detectStoryContexts(title: string, body: string): string[] {
  const combined = `${title} ${body}`.toLowerCase();
  const matched: string[] = [];

  for (const ctx of KNOWN_CONTEXTS) {
    const hits = ctx.keywords.some((kw) => {
      // Word boundary match where possible
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(combined);
    });
    if (hits) {
      matched.push(ctx.name);
    }
  }

  if (matched.length === 0) {
    // Extract first distinctive words if no broad category matched
    const words = title.split(/\s+/).filter((w) => w.length > 4);
    if (words.length > 0) {
      matched.push(`Topic: ${words[0]}`);
    } else {
      matched.push("General Situations");
    }
  }

  return matched;
}

export function loadAccountPreferences(accountKey: string): AccountAlgorithmPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(accountKey);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      excludedStoryIds: Array.isArray(parsed.excludedStoryIds) ? parsed.excludedStoryIds : [],
      excludedFeedbackIds: Array.isArray(parsed.excludedFeedbackIds)
        ? parsed.excludedFeedbackIds
        : [],
      excludedContexts: Array.isArray(parsed.excludedContexts) ? parsed.excludedContexts : [],
      log: Array.isArray(parsed.log) ? parsed.log : [],
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveAccountPreferences(accountKey: string, prefs: AccountAlgorithmPreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(accountKey, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("olive:algo-updated", { detail: { accountKey } }));
  } catch (err) {
    console.error("Failed to save algorithm preferences", err);
  }
}

export function useAccountAlgorithm(nickname?: string) {
  // Use a stable account key so changing random nicknames on posts doesn't clear exclusions
  const storageKey = getAccountStorageKey(nickname || "device");
  const [preferences, setPreferences] = useState<AccountAlgorithmPreferences>(() =>
    loadAccountPreferences(storageKey),
  );

  useEffect(() => {
    const key = getAccountStorageKey(nickname || "device");
    setPreferences(loadAccountPreferences(key));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ accountKey: string }>;
      if (!customEvent.detail || customEvent.detail.accountKey === key) {
        setPreferences(loadAccountPreferences(key));
      }
    };

    window.addEventListener("olive:algo-updated", handleUpdate);
    return () => window.removeEventListener("olive:algo-updated", handleUpdate);
  }, [nickname]);

  const recordDislikedContext = useCallback(
    (story: { id: string; title: string; body: string }) => {
      const key = getAccountStorageKey(nickname || "device");
      const current = loadAccountPreferences(key);
      const contexts = detectStoryContexts(story.title, story.body);

      // Add story ID if not present
      const nextStoryIds = current.excludedStoryIds.includes(story.id)
        ? current.excludedStoryIds
        : [...current.excludedStoryIds, story.id];

      // Add any newly detected contexts that aren't already excluded
      const nextContexts = Array.from(new Set([...current.excludedContexts, ...contexts]));

      const newEntry: ExcludedContextLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        targetId: story.id,
        targetType: "story",
        title: story.title,
        snippet: story.body.slice(0, 100),
        detectedContexts: contexts,
        timestamp: Date.now(),
      };

      const updated: AccountAlgorithmPreferences = {
        ...current,
        excludedStoryIds: nextStoryIds,
        excludedContexts: nextContexts,
        log: [newEntry, ...current.log.slice(0, 50)],
      };

      saveAccountPreferences(key, updated);
      setPreferences(updated);

      return {
        excludedContexts: contexts,
        storyId: story.id,
        undo: () => {
          const fresh = loadAccountPreferences(key);
          const restoredStoryIds = fresh.excludedStoryIds.filter((id) => id !== story.id);
          // If no other logs require these contexts, we can keep them or remove them
          const remainingLogs = fresh.log.filter((l) => l.targetId !== story.id);
          const activeContexts = new Set(remainingLogs.flatMap((l) => l.detectedContexts));
          const restoredContexts = fresh.excludedContexts.filter((c) => activeContexts.has(c));

          const rolledBack: AccountAlgorithmPreferences = {
            ...fresh,
            excludedStoryIds: restoredStoryIds,
            excludedContexts: restoredContexts,
            log: remainingLogs,
          };
          saveAccountPreferences(key, rolledBack);
          setPreferences(rolledBack);
        },
      };
    },
    [nickname],
  );

  const recordDislikedFeedback = useCallback(
    (feedback: { id: string; body: string; nickname: string }, storyTitle?: string) => {
      const key = getAccountStorageKey(nickname || "device");
      const current = loadAccountPreferences(key);

      const nextFeedbackIds = current.excludedFeedbackIds.includes(feedback.id)
        ? current.excludedFeedbackIds
        : [...current.excludedFeedbackIds, feedback.id];

      const detected = detectStoryContexts(storyTitle || "", feedback.body);

      const newEntry: ExcludedContextLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        targetId: feedback.id,
        targetType: "feedback",
        title: storyTitle,
        snippet: feedback.body.slice(0, 100),
        detectedContexts: detected,
        timestamp: Date.now(),
      };

      const updated: AccountAlgorithmPreferences = {
        ...current,
        excludedFeedbackIds: nextFeedbackIds,
        log: [newEntry, ...current.log.slice(0, 50)],
      };

      saveAccountPreferences(key, updated);
      setPreferences(updated);

      return {
        feedbackId: feedback.id,
        undo: () => {
          const fresh = loadAccountPreferences(key);
          const rolledBack: AccountAlgorithmPreferences = {
            ...fresh,
            excludedFeedbackIds: fresh.excludedFeedbackIds.filter((id) => id !== feedback.id),
            log: fresh.log.filter((l) => l.targetId !== feedback.id),
          };
          saveAccountPreferences(key, rolledBack);
          setPreferences(rolledBack);
        },
      };
    },
    [nickname],
  );

  const removeExcludedContext = useCallback(
    (contextName: string) => {
      const key = getAccountStorageKey(nickname || "device");
      const current = loadAccountPreferences(key);
      const updated: AccountAlgorithmPreferences = {
        ...current,
        excludedContexts: current.excludedContexts.filter((c) => c !== contextName),
      };
      saveAccountPreferences(key, updated);
      setPreferences(updated);
    },
    [nickname],
  );

  const restoreStory = useCallback(
    (storyId: string) => {
      const key = getAccountStorageKey(nickname || "device");
      const current = loadAccountPreferences(key);
      const updated: AccountAlgorithmPreferences = {
        ...current,
        excludedStoryIds: current.excludedStoryIds.filter((id) => id !== storyId),
        log: current.log.filter((l) => l.targetId !== storyId),
      };
      saveAccountPreferences(key, updated);
      setPreferences(updated);
    },
    [nickname],
  );

  const restoreFeedback = useCallback(
    (feedbackId: string) => {
      const key = getAccountStorageKey(nickname || "device");
      const current = loadAccountPreferences(key);
      const updated: AccountAlgorithmPreferences = {
        ...current,
        excludedFeedbackIds: current.excludedFeedbackIds.filter((id) => id !== feedbackId),
        log: current.log.filter((l) => l.targetId !== feedbackId),
      };
      saveAccountPreferences(key, updated);
      setPreferences(updated);
    },
    [nickname],
  );

  const resetAllExclusions = useCallback(() => {
    const key = getAccountStorageKey(nickname || "device");
    saveAccountPreferences(key, DEFAULT_PREFERENCES);
    setPreferences(DEFAULT_PREFERENCES);
  }, [nickname]);

  // Check if a story should be excluded by the algorithm
  const checkStoryExclusion = useCallback(
    (story: {
      id: string;
      title: string;
      body: string;
    }): { isExcluded: boolean; reason?: string } => {
      if (preferences.excludedStoryIds.includes(story.id)) {
        return { isExcluded: true, reason: "You excluded this specific story" };
      }

      if (preferences.excludedContexts.length > 0) {
        const detected = detectStoryContexts(story.title, story.body);
        const matched = detected.find((ctx) => preferences.excludedContexts.includes(ctx));
        if (matched) {
          return {
            isExcluded: true,
            reason: `Excluded by algorithm topic filter: "${matched}"`,
          };
        }
      }

      return { isExcluded: false };
    },
    [preferences],
  );

  const checkFeedbackExclusion = useCallback(
    (feedbackId: string): boolean => {
      return preferences.excludedFeedbackIds.includes(feedbackId);
    },
    [preferences],
  );

  return {
    preferences,
    recordDislikedContext,
    recordDislikedFeedback,
    removeExcludedContext,
    restoreStory,
    restoreFeedback,
    resetAllExclusions,
    checkStoryExclusion,
    checkFeedbackExclusion,
  };
}
