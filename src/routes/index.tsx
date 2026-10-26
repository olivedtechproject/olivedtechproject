import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Wind, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Common Ground — work through conflicts together" },
      { name: "description", content: "A kind place for kids to share their side of a conflict, calm big feelings, and reach out to make things right." },
      { property: "og:title", content: "Common Ground — work through conflicts together" },
      { property: "og:description", content: "Share your side, calm big feelings, and reach out to make things right." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const steps = [
  { to: "/stories", icon: MessageCircle, title: "1. Share your side", text: "Post what happened under a nickname and hear what others think. Give kind feedback on other stories too." },
  { to: "/calm", icon: Wind, title: "2. Calm the storm", text: "Pick how you feel and find a way to settle it, like lying down with music or a walk outside." },
  { to: "/reach-out", icon: Mail, title: "3. Reach out", text: "Write a letter to the other person: how you saw it, how you feel, and something kind for the future." },
] as const;

function Index() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-10">
      <section className="py-16 text-center md:py-24">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">Had a falling out?</p>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight text-foreground md:text-6xl">
          Every conflict has two sides. Let's find the common ground.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          A gentle place to be heard, cool down, and take the first step toward fixing things.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <Link key={s.to} to={s.to} className="group rounded-[var(--radius)] bg-card p-7 shadow-soft transition-transform hover:-translate-y-1">
            <s.icon className="h-9 w-9 text-primary" />
            <h2 className="mt-5 text-2xl font-bold">{s.title}</h2>
            <p className="mt-2 text-muted-foreground">{s.text}</p>
            <span className="mt-5 inline-flex items-center gap-1 font-bold text-primary">
              Go <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
