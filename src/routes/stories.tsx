import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Stories — Common Ground" },
      { name: "description", content: "Share your side of a conflict anonymously and give kind feedback to others." },
      { property: "og:title", content: "Stories — Common Ground" },
      { property: "og:description", content: "Share your side of a conflict anonymously and give kind feedback to others." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stories,
});

const verdicts = {
  fair: "You were fair",
  unfair: "You could do better",
  both: "Both sides have a point",
  unsure: "Not sure yet",
} as const;
type Verdict = keyof typeof verdicts;

function useNickname() {
  const [nick, setNick] = useState(() => (typeof window === "undefined" ? "" : localStorage.getItem("cg-nick") ?? ""));
  return [nick, (v: string) => { setNick(v); localStorage.setItem("cg-nick", v); }] as const;
}

function Stories() {
  const qc = useQueryClient();
  const [nick, setNick] = useNickname();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*, feedback(*)")
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "feedback", ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || title.trim().length < 3 || body.trim().length < 10) {
      toast.error("Add a nickname, a title, and a bit more about what happened.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("stories").insert({ nickname: nick.trim(), title: title.trim(), body: body.trim() });
    setBusy(false);
    if (error) { toast.error("Couldn't post. Try again."); return; }
    setTitle(""); setBody("");
    toast.success("Your story is up. Be kind to yourself.");
    qc.invalidateQueries({ queryKey: ["stories"] });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Share your side</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Tell what happened and ask: was I fair? Use a nickname — never your real name or anyone else's.
      </p>

      <form onSubmit={post} className="mt-8 space-y-3 rounded-[var(--radius)] bg-card p-6 shadow-soft">
        <Input placeholder="Your nickname" maxLength={30} value={nick} onChange={(e) => setNick(e.target.value)} />
        <Input placeholder="What happened, in one line" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Tell the story. How did it start? What did you do? How do you feel?" rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" disabled={busy} className="rounded-full">Post my story</Button>
      </form>

      <div className="mt-10 space-y-6">
        {isLoading && <p className="text-muted-foreground">Loading stories…</p>}
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} nick={nick} />
        ))}
      </div>
    </main>
  );
}

type Story = { id: string; nickname: string; title: string; body: string; created_at: string; feedback: { id: string; nickname: string; verdict: string; body: string }[] };

function StoryCard({ story, nick }: { story: Story; nick: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>("both");
  const [text, setText] = useState("");

  const counts = story.feedback.reduce<Record<string, number>>((a, f) => ({ ...a, [f.verdict]: (a[f.verdict] ?? 0) + 1 }), {});

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim()) { toast.error("Add your nickname in the box at the top first."); return; }
    if (text.trim().length < 2) return;
    const { error } = await supabase.from("feedback").insert({ story_id: story.id, nickname: nick.trim(), verdict, body: text.trim() });
    if (error) { toast.error("Couldn't send feedback."); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["stories"] });
  }

  return (
    <article className="rounded-[var(--radius)] border border-border bg-card/90 p-6">
      <p className="text-sm font-bold text-primary">@{story.nickname}</p>
      <h2 className="mt-1 text-2xl font-bold">{story.title}</h2>
      <p className="mt-3 whitespace-pre-line text-foreground/90">{story.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(verdicts) as Verdict[]).filter((v) => counts[v]).map((v) => (
          <span key={v} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
            {verdicts[v]} · {counts[v]}
          </span>
        ))}
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 text-sm font-bold text-primary">
        {open ? "Hide" : "Read"} feedback ({story.feedback.length})
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {story.feedback.map((f) => (
            <div key={f.id} className="rounded-2xl bg-muted p-4">
              <p className="text-sm"><b>@{f.nickname}</b> <span className="text-muted-foreground">· {verdicts[f.verdict as Verdict]}</span></p>
              <p className="mt-1">{f.body}</p>
            </div>
          ))}
          <form onSubmit={reply} className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(verdicts) as Verdict[]).map((v) => (
                <button type="button" key={v} onClick={() => setVerdict(v)}
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${verdict === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                  {verdicts[v]}
                </button>
              ))}
            </div>
            <Textarea rows={2} maxLength={1500} placeholder="Be kind and helpful. What could help them fix it?" value={text} onChange={(e) => setText(e.target.value)} />
            <Button type="submit" size="sm" className="rounded-full">Send feedback</Button>
          </form>
        </div>
      )}
    </article>
  );
}
