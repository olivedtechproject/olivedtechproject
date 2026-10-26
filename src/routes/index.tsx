import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Wind, Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Olive — extend the branch" },
      { name: "description", content: "For teens, by teens: ask if you were in the wrong, cool down, and reach out to make things right." },
      { property: "og:title", content: "Olive — extend the branch" },
      { property: "og:description", content: "For teens, by teens: ask if you were in the wrong, cool down, and reach out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const steps = [
  { to: "/stories", icon: MessageCircle, title: "Am I in the Wrong?", text: "Share what happened and hear kind opinions." },
  { to: "/calm", icon: Wind, title: "Cool Down", text: "Tips and tricks to calm down and feel better." },
  { to: "/reach-out", icon: Mail, title: "Reach Out", text: "Send a note, signed or anonymous." },
] as const;

function Index() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-10">
      <section className="relative overflow-hidden py-16 text-center md:py-24">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full border-[28px] border-secondary" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border-[20px] border-accent" />
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Extend the branch</p>
        <h1 className="mt-4 text-5xl font-bold md:text-7xl">Start your journey</h1>
        <Link to="/calm" className="mt-8 inline-block rounded-full border-2 border-primary bg-card px-8 py-3 text-xl font-bold text-primary shadow-soft transition-transform hover:-translate-y-0.5">
          What am I feeling?
        </Link>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <Link key={s.to} to={s.to} className="rounded-[var(--radius)] bg-card p-7 shadow-soft transition-transform hover:-translate-y-1">
            <s.icon className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">{s.title}</h2>
            <p className="mt-2 text-muted-foreground">{s.text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-3xl font-bold">What We Believe</h2>
        <p className="mt-4 max-w-3xl text-lg text-foreground/90">
          Understanding your own emotions is key to understanding others. Our three-pronged approach offers teens a way to
          express their emotions in a way that will positively impact their present and future relationships.
        </p>
        <p className="mt-8 inline-block rounded-md border border-border px-3 py-1 text-sm font-bold text-muted-foreground">For Teens by Teens</p>
      </section>
    </main>
  );
}
