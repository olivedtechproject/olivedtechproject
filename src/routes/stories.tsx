import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, ArrowBigUp, ArrowBigDown, MessageCircle, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Am I in the Wrong? — Olive" },
      { name: "description", content: "Tell your side of a conflict under a nickname and give kind feedback to other teens." },
      { property: "og:title", content: "Am I in the Wrong? — Olive" },
      { property: "og:description", content: "Tell your side of a conflict under a nickname and give kind feedback to other teens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stories,
});

const starters = ["Another perspective:", "Something you could try:", "I've been there:"];

function useNickname() {
  const [nick, setNick] = useState("");
  useEffect(() => { setNick(localStorage.getItem("cg-nick") ?? ""); }, []);
  return [nick, (v: string) => { setNick(v); localStorage.setItem("cg-nick", v); }] as const;
}

function useReacted() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { setDone(JSON.parse(localStorage.getItem("olive-reacted") ?? "[]")); }, []);
  return [done, (k: string) => { const n = [...done, k]; setDone(n); localStorage.setItem("olive-reacted", JSON.stringify(n)); }] as const;
}

type Fb = { id: string; nickname: string; body: string; hearts: number; upvotes: number; downvotes: number };
type Story = { id: string; nickname: string; title: string; body: string; hearts: number; upvotes: number; feedback: Fb[] };

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
        .select("id, nickname, title, body, hearts, upvotes, feedback(id, nickname, body, hearts, upvotes, downvotes)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "feedback", ascending: true });
      if (error) throw error;
      return data as Story[];
    },
  });

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || title.trim().length < 3 || body.trim().length < 10) {
      toast.error("Add a nickname, a title, and a bit more about what happened.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("stories").insert({ nickname: nick.trim(), title: title.trim(), body: body.trim(), status: "pending" });
    setBusy(false);
    if (error) { toast.error("Couldn't post. Try again."); return; }
    setTitle(""); setBody("");
    toast.success("Sent! A moderator will check your post before it shows up.");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-10">
      <h1 className="mt-6 text-4xl font-bold md:text-5xl">Am I in the Wrong?</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Tell what happened and ask: was I fair? Use a nickname — never your real name or anyone else's.
      </p>

      <form onSubmit={post} className="mt-8 space-y-3 rounded-[var(--radius)] bg-card p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-10 w-10 shrink-0 text-primary" />
          <Input placeholder="Your nickname, e.g. AmazingGiraffe" maxLength={30} value={nick} onChange={(e) => setNick(e.target.value)} />
        </div>
        <Input placeholder="AITW for… (one line)" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Tell the story. How did it start? What did you do? How do you feel?" rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy} className="rounded-full">Send for approval</Button>
          <span className="text-sm text-muted-foreground">Posts are checked by a moderator first.</span>
        </div>
      </form>

      <div className="mt-10 space-y-6">
        {isLoading && <p className="text-muted-foreground">Loading stories…</p>}
        {stories.map((s) => <StoryCard key={s.id} story={s} nick={nick} />)}
      </div>
    </main>
  );
}

function React_({ icon: Icon, count, active, onClick, label }: { icon: typeof Heart; count: number; active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={active}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
      <Icon className="h-4 w-4" /> {count}
    </button>
  );
}

function StoryCard({ story, nick }: { story: Story; nick: string }) {
  const qc = useQueryClient();
  const [done, mark] = useReacted();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  async function react(kind: "heart" | "up" | "down", target: "story" | "feedback", id: string) {
    const key = `${target}:${kind}:${id}`;
    if (done.includes(key)) return;
    mark(key);
    const { error } = await supabase.rpc("react", { _kind: kind, _target: target, _id: id });
    if (error) toast.error("Couldn't save that.");
    qc.invalidateQueries({ queryKey: ["stories"] });
  }

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim()) { toast.error("Add your nickname in the box at the top first."); return; }
    if (text.trim().length < 2) return;
    const { error } = await supabase.from("feedback").insert({ story_id: story.id, nickname: nick.trim(), verdict: "both", body: text.trim() });
    if (error) { toast.error("Couldn't send feedback."); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["stories"] });
  }

  return (
    <article className="rounded-[var(--radius)] border border-border bg-card/90 p-6">
      <p className="flex items-center gap-2 text-sm font-bold text-primary"><UserCircle2 className="h-5 w-5" /> {story.nickname}</p>
      <h2 className="mt-1 text-2xl font-bold">{story.title}</h2>
      <p className="mt-3 whitespace-pre-line text-foreground/90">{story.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground hover:bg-accent">
          <MessageCircle className="h-4 w-4" /> {story.feedback.length}
        </button>
        <React_ icon={Heart} label="Heart" count={story.hearts} active={done.includes(`story:heart:${story.id}`)} onClick={() => react("heart", "story", story.id)} />
        <React_ icon={ArrowBigUp} label="Upvote" count={story.upvotes} active={done.includes(`story:up:${story.id}`)} onClick={() => react("up", "story", story.id)} />
      </div>
      {open && (
        <div className="mt-4 space-y-3">
          {story.feedback.map((f) => (
            <div key={f.id} className="rounded-2xl bg-muted p-4">
              <p className="flex items-center gap-1 text-sm font-bold"><UserCircle2 className="h-4 w-4" /> {f.nickname} says:</p>
              <p className="mt-1 whitespace-pre-line">{f.body}</p>
              <div className="mt-2 flex gap-2">
                <React_ icon={Heart} label="Heart" count={f.hearts} active={done.includes(`feedback:heart:${f.id}`)} onClick={() => react("heart", "feedback", f.id)} />
                <React_ icon={ArrowBigUp} label="Upvote" count={f.upvotes} active={done.includes(`feedback:up:${f.id}`)} onClick={() => react("up", "feedback", f.id)} />
                <React_ icon={ArrowBigDown} label="Downvote" count={f.downvotes} active={done.includes(`feedback:down:${f.id}`)} onClick={() => react("down", "feedback", f.id)} />
              </div>
            </div>
          ))}
          <form onSubmit={reply} className="space-y-2 rounded-2xl border border-border p-4">
            <p className="text-sm font-bold">Sentence starters</p>
            <div className="flex flex-wrap gap-2">
              {starters.map((s) => (
                <button type="button" key={s} onClick={() => setText(s + " ")}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold hover:bg-secondary">
                  {s.replace(":", "")}
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
