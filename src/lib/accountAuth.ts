import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { NICKNAME_ADJECTIVES, NICKNAME_NOUNS } from "@/lib/nicknameGenerator";

const ACCOUNT_NAMES_KEY = "olive_account_usernames_v1";

/**
 * Generates a permanent Reddit-style assigned username (e.g., "Mindful-Otter-482").
 */
export function generateAccountUsername(): string {
  const adj = NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const noun = NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 3 digits: 100-999
  return `${adj}-${noun}-${num}`;
}

/**
 * Deterministic fallback username derived from user ID for legacy accounts
 * created prior to assigned_username metadata.
 */
export function deriveDeterministicUsername(userId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = hash >>> 0;
  const adj = NICKNAME_ADJECTIVES[positive % NICKNAME_ADJECTIVES.length];
  const noun = NICKNAME_NOUNS[Math.floor(positive / 37) % NICKNAME_NOUNS.length];
  const num = (positive % 900) + 100;
  return `${adj}-${noun}-${num}`;
}

function readCachedUsernames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACCOUNT_NAMES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function cacheAccountUsername(key: string, username: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = readCachedUsernames();
    if (!map[key]) {
      map[key] = username;
      window.localStorage.setItem(ACCOUNT_NAMES_KEY, JSON.stringify(map));
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Resolves the permanent, immutable username for a signed-in user.
 * Once assigned at account creation, this name cannot be changed.
 */
export function getAssignedAccountUsername(user: User | null | undefined): string | null {
  if (!user) return null;

  const metaName =
    typeof user.user_metadata?.assigned_username === "string"
      ? user.user_metadata.assigned_username.trim()
      : "";

  if (metaName) {
    cacheAccountUsername(user.id, metaName);
    return metaName;
  }

  const cached = readCachedUsernames();
  if (cached[user.id]) {
    return cached[user.id];
  }
  if (user.email && cached[`email:${user.email.trim().toLowerCase()}`]) {
    const fromEmail = cached[`email:${user.email.trim().toLowerCase()}`];
    cacheAccountUsername(user.id, fromEmail);
    return fromEmail;
  }

  const derived = deriveDeterministicUsername(user.id);
  cacheAccountUsername(user.id, derived);
  return derived;
}

/**
 * Signs up a new user account and permanently assigns a Reddit-style username
 * stored in user_metadata at creation time.
 */
export async function createAccountWithAssignedName(
  email: string,
  password: string,
  redirectPath = "/account",
) {
  const assignedUsername = generateAccountUsername();
  const cleanEmail = email.trim();

  const res = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo:
        typeof window !== "undefined" ? `${window.location.origin}${redirectPath}` : undefined,
      data: {
        assigned_username: assignedUsername,
      },
    },
  });

  if (!res.error) {
    cacheAccountUsername(`email:${cleanEmail.toLowerCase()}`, assignedUsername);
    if (res.data.user?.id) {
      cacheAccountUsername(res.data.user.id, assignedUsername);
    }
  }

  return {
    ...res,
    assignedUsername,
  };
}

export function useAccountSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const assignedUsername = getAssignedAccountUsername(user);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    assignedUsername,
    loading,
    signOut,
  };
}
