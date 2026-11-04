import { loadAccountPreferences, getAccountStorageKey } from "./feedAlgorithm";

export interface UserSiteHistory {
  nickname?: string;
  pastTopics: string[];
  excludedContexts: string[];
  recentStoriesCount: number;
  userDraftOrLetter?: string;
  pastStoriesSnippets?: string[];
}

export interface StoredUserStory {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

export function recordUserPostedStory(title: string, body: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("olive_user_posted_stories");
    const existing: StoredUserStory[] = raw ? JSON.parse(raw) : [];
    const updated = [
      {
        id: `local-${Date.now()}`,
        title,
        body,
        createdAt: Date.now(),
      },
      ...existing.slice(0, 9), // keep last 10
    ];
    localStorage.setItem("olive_user_posted_stories", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to record user story:", err);
  }
}

export function gatherUserSiteHistory(currentNickname?: string): UserSiteHistory {
  if (typeof window === "undefined") {
    return {
      nickname: currentNickname,
      pastTopics: [],
      excludedContexts: [],
      recentStoriesCount: 0,
    };
  }

  try {
    const key = getAccountStorageKey(currentNickname || "device");
    const prefs = loadAccountPreferences(key);

    const rawStories = localStorage.getItem("olive_user_posted_stories");
    const pastStories: StoredUserStory[] = rawStories ? JSON.parse(rawStories) : [];

    const rawReachOut = localStorage.getItem("olive_reachout_draft");

    // Gather distinct topics and contexts from algorithm logs and stories
    const topicsSet = new Set<string>();
    prefs.log.forEach((l) => l.detectedContexts.forEach((c) => topicsSet.add(c)));
    pastStories.forEach((s) => {
      if (s.title) topicsSet.add(s.title);
    });

    return {
      nickname: currentNickname,
      pastTopics: Array.from(topicsSet).slice(0, 8),
      excludedContexts: prefs.excludedContexts,
      recentStoriesCount: pastStories.length,
      userDraftOrLetter: rawReachOut || undefined,
      pastStoriesSnippets: pastStories.map((s) => `"${s.title}": ${s.body.slice(0, 120)}...`),
    };
  } catch {
    return {
      nickname: currentNickname,
      pastTopics: [],
      excludedContexts: [],
      recentStoriesCount: 0,
    };
  }
}
