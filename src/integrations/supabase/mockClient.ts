// In-memory / localStorage fallback when Supabase credentials are not supplied
// Allows the imported application to run seamlessly in the AI Studio environment.

export interface MockStory {
  id: string;
  nickname: string;
  title: string;
  body: string;
  hearts: number;
  upvotes: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  feedback: MockFeedback[];
}

export interface MockFeedback {
  id: string;
  story_id: string;
  nickname: string;
  verdict: "fair" | "unfair" | "both" | "unsure";
  body: string;
  hearts: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface MockTip {
  id: string;
  nickname: string;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const INITIAL_STORIES: MockStory[] = [
  {
    id: "story-1",
    nickname: "quietfox",
    title: "My best friend sat with someone else at lunch",
    body: "We always sit together. Today she sat with a new girl and didn't even wave at me. I ignored her texts after school. Was I wrong to ignore her?",
    hearts: 8,
    upvotes: 14,
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    feedback: [
      {
        id: "fb-1",
        story_id: "story-1",
        nickname: "sunnyday",
        verdict: "both",
        body: "It makes sense you felt left out, but maybe ask her about it instead of ignoring her. She might have been trying to be kind to the new girl.",
        hearts: 5,
        upvotes: 9,
        downvotes: 0,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: "story-2",
    nickname: "pixelbean",
    title: "Brother read my journal",
    body: "My little brother read my journal and told my mom something private. I yelled at him and said I hated him. Now he won't talk to me.",
    hearts: 12,
    upvotes: 19,
    status: "approved",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    feedback: [
      {
        id: "fb-2",
        story_id: "story-2",
        nickname: "coffeecat",
        verdict: "unfair",
        body: "Your feelings are valid because privacy is important, but tell him you're sorry for saying you hated him and explain why privacy matters.",
        hearts: 7,
        upvotes: 11,
        downvotes: 0,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
  },
  {
    id: "story-3",
    nickname: "skater88",
    title: "Left out of group chat plans",
    body: "My friends made weekend plans without me right in the group chat. I left the group without saying anything.",
    hearts: 0,
    upvotes: 0,
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    feedback: [],
  },
];

const INITIAL_TIPS: MockTip[] = [
  {
    id: "tip-1",
    nickname: "lakebreeze",
    title: "Feeling overwhelmed during exams?",
    body: "Step outside for 3 minutes, breathe the cold air, drink cold water with ice, and set a timer for 20 minutes of focus.",
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "tip-2",
    nickname: "nightowl",
    title: "Overthinking a text message you sent?",
    body: "Put your phone in another room for 30 minutes. 99% of things we worry about happening never actually happen.",
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "tip-3",
    nickname: "zenpanda",
    title: "Friend forgot my birthday?",
    body: "Give them a day to remember before getting angry; people have a lot going on at home.",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "tip-sibling",
    nickname: "peacekeeper44",
    title: "Brother or sister won't stop bothering you?",
    body: "Put on headphones with your favorite playlist and close your door. When you stop giving them an irritated reaction, they get bored and wander off. Protect your peace first!",
    status: "approved",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

class MemoryStore {
  stories: MockStory[] = [];
  tips: MockTip[] = [];
  session: {
    user: { id: string; email: string; user_metadata?: Record<string, unknown> };
    access_token: string;
  } | null = null;
  authUsersByEmail: Record<string, { id: string; user_metadata: Record<string, unknown> }> = {};
  authListeners: Array<(event: string, session: unknown) => void> = [];

  constructor() {
    this.load();
  }

  load() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const s = localStorage.getItem("olive-mock-stories");
        this.stories = s ? JSON.parse(s) : INITIAL_STORIES;
        const t = localStorage.getItem("olive-mock-tips");
        this.tips = t ? JSON.parse(t) : INITIAL_TIPS;
        const sess = localStorage.getItem("olive-mock-session");
        this.session = sess ? JSON.parse(sess) : null;
        return;
      } catch {
        // Fallback to initial
      }
    }
    this.stories = JSON.parse(JSON.stringify(INITIAL_STORIES));
    this.tips = JSON.parse(JSON.stringify(INITIAL_TIPS));
  }

  save() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("olive-mock-stories", JSON.stringify(this.stories));
        localStorage.setItem("olive-mock-tips", JSON.stringify(this.tips));
        if (this.session) {
          localStorage.setItem("olive-mock-session", JSON.stringify(this.session));
        } else {
          localStorage.removeItem("olive-mock-session");
        }
      } catch {
        // Storage might fail in sandboxes
      }
    }
  }

  notifyAuth(event: string) {
    for (const listener of this.authListeners) {
      listener(event, this.session);
    }
  }
}

const store = new MemoryStore();

function createQueryBuilder(table: string) {
  let statusFilter: string | null = null;
  let idFilter: string | null = null;

  const builder = {
    select(_columns = "*") {
      return builder;
    },
    eq(column: string, value: string) {
      if (column === "status") statusFilter = value;
      if (column === "id") idFilter = value;
      return builder;
    },
    order(_column: string, _opts?: { ascending?: boolean; referencedTable?: string }) {
      return builder;
    },
    // Promise-like implementation
    then(
      onfulfilled?: (val: { data: unknown[]; error: null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) {
      let data: unknown[] = [];
      if (table === "stories") {
        let list = [...store.stories];
        if (statusFilter) {
          list = list.filter((s) => s.status === statusFilter);
        }
        data = list;
      } else if (table === "tips") {
        let list = [...store.tips];
        if (statusFilter) {
          list = list.filter((t) => t.status === statusFilter);
        }
        data = list;
      } else if (table === "feedback") {
        data = store.stories.flatMap((s) => s.feedback);
      }
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    },
    catch(onrejected?: (reason: unknown) => unknown) {
      return Promise.resolve({ data: [], error: null }).catch(onrejected);
    },
  };

  return builder;
}

export function createMockSupabaseClient() {
  return {
    from(table: string) {
      return {
        select(columns = "*") {
          return createQueryBuilder(table).select(columns);
        },
        async insert(record: Record<string, unknown>) {
          const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const created_at = new Date().toISOString();

          if (table === "stories") {
            const newStory: MockStory = {
              id,
              nickname: (record.nickname as string) || "Anonymous",
              title: (record.title as string) || "",
              body: (record.body as string) || "",
              hearts: 0,
              upvotes: 0,
              status: (record.status as "pending" | "approved") || "pending",
              created_at,
              feedback: [],
            };
            store.stories.unshift(newStory);
            store.save();
            return { data: [newStory], error: null };
          }

          if (table === "tips") {
            const newTip: MockTip = {
              id,
              nickname: (record.nickname as string) || "Anonymous",
              title: (record.title as string) || "",
              body: (record.body as string) || "",
              status: (record.status as "pending" | "approved") || "pending",
              created_at,
            };
            store.tips.unshift(newTip);
            store.save();
            return { data: [newTip], error: null };
          }

          if (table === "feedback") {
            const storyId = record.story_id as string;
            const newFeedback: MockFeedback = {
              id,
              story_id: storyId,
              nickname: (record.nickname as string) || "Anonymous",
              verdict: (record.verdict as MockFeedback["verdict"]) || "both",
              body: (record.body as string) || "",
              hearts: 0,
              upvotes: 0,
              downvotes: 0,
              created_at,
            };
            const story = store.stories.find((s) => s.id === storyId);
            if (story) {
              story.feedback.push(newFeedback);
              store.save();
            }
            return { data: [newFeedback], error: null };
          }

          return { data: [record], error: null };
        },
        update(updates: Record<string, unknown>) {
          return {
            eq(column: string, value: string) {
              if (column === "id") {
                if (table === "stories") {
                  const item = store.stories.find((s) => s.id === value);
                  if (item) Object.assign(item, updates);
                } else if (table === "feedback") {
                  for (const s of store.stories) {
                    const fb = s.feedback.find((f) => f.id === value);
                    if (fb) {
                      Object.assign(fb, updates);
                      break;
                    }
                  }
                } else if (table === "tips") {
                  const item = store.tips.find((t) => t.id === value);
                  if (item) Object.assign(item, updates);
                }
                store.save();
              }
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
    async rpc(name: string, args?: Record<string, unknown>) {
      if (name === "react") {
        const { _kind, _target, _id } = (args ?? {}) as {
          _kind: "heart" | "up" | "down";
          _target: "story" | "feedback";
          _id: string;
        };
        if (_target === "story") {
          const story = store.stories.find((s) => s.id === _id);
          if (story) {
            if (_kind === "heart") story.hearts++;
            if (_kind === "up") story.upvotes++;
            store.save();
          }
        } else if (_target === "feedback") {
          for (const story of store.stories) {
            const fb = story.feedback.find((f) => f.id === _id);
            if (fb) {
              if (_kind === "heart") fb.hearts++;
              if (_kind === "up") fb.upvotes++;
              // Downvoting has been replaced by private user-account algorithm context feedback
              // so public negative downvotes are no longer incremented.
              if (_kind === "down") {
                // No-op for public score
              }
              store.save();
              break;
            }
          }
        }
        return { data: null, error: null };
      }

      if (name === "has_role") {
        // Allow moderator role for demo/testing
        return { data: true, error: null };
      }

      return { data: null, error: null };
    },
    auth: {
      async getSession() {
        return { data: { session: store.session }, error: null };
      },
      onAuthStateChange(callback: (event: string, session: unknown) => void) {
        store.authListeners.push(callback);
        // Dispatch current state immediately
        callback(store.session ? "SIGNED_IN" : "SIGNED_OUT", store.session);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                store.authListeners = store.authListeners.filter((l) => l !== callback);
              },
            },
          },
        };
      },
      async signInWithPassword({ email }: { email: string; password?: string }) {
        const key = email.trim().toLowerCase();
        const existing = store.authUsersByEmail[key];
        store.session = {
          user: {
            id: existing?.id ?? `user-${key}`,
            email,
            user_metadata: existing?.user_metadata ?? {},
          },
          access_token: "mock-jwt-token",
        };
        store.save();
        store.notifyAuth("SIGNED_IN");
        return { data: { session: store.session, user: store.session.user }, error: null };
      },
      async signUp({
        email,
        options,
      }: {
        email: string;
        password?: string;
        options?: { data?: Record<string, unknown> };
      }) {
        const key = email.trim().toLowerCase();
        const id =
          store.authUsersByEmail[key]?.id ??
          `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const user_metadata = store.authUsersByEmail[key]?.user_metadata ?? options?.data ?? {};
        store.authUsersByEmail[key] = { id, user_metadata };
        store.session = {
          user: { id, email, user_metadata },
          access_token: "mock-jwt-token",
        };
        store.save();
        store.notifyAuth("SIGNED_IN");
        return { data: { session: store.session, user: store.session.user }, error: null };
      },
      async signOut() {
        store.session = null;
        store.save();
        store.notifyAuth("SIGNED_OUT");
        return { error: null };
      },
    },
  };
}
