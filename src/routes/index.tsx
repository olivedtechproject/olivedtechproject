import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Wind, Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Olive — extend the branch" },
      {
        name: "description",
        content:
          "For teens, by teens: ask if you were in the wrong, cool down, and reach out to make things right.",
      },
      { property: "og:title", content: "Olive — extend the branch" },
      {
        property: "og:description",
        content: "For teens, by teens: ask if you were in the wrong, cool down, and reach out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const steps = [
  {
    to: "/stories",
    icon: MessageCircle,
    title: "Am I in the Wrong?",
    text: "Share what happened and hear kind opinions.",
    accent: "hover:border-navy/40",
  },
  {
    to: "/calm",
    icon: Wind,
    title: "Cool Down",
    text: "Tips and tricks to calm down and feel better.",
    accent: "hover:border-primary/40",
  },
  {
    to: "/reach-out",
    icon: Mail,
    title: "Reach Out",
    text: "Send a note, signed or anonymous.",
    accent: "hover:border-navy/40",
  },
] as const;

function Index() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 text-center md:py-28">
        {/* Circle Insignia positioned directly behind the letters with navy accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center"
        >
          {/* Outer ring with navy accent */}
          <div className="h-[28rem] w-[28rem] rounded-full border-[28px] border-navy/10 md:h-[34rem] md:w-[34rem]" />
          {/* Middle secondary ring */}
          <div className="absolute h-[21rem] w-[21rem] rounded-full border-[22px] border-secondary/80 md:h-[26rem] md:w-[26rem]" />
          {/* Inner accent ring with navy accent */}
          <div className="absolute h-[14rem] w-[14rem] rounded-full border-[16px] border-navy/20 md:h-[18rem] md:w-[18rem]" />
          {/* Delicate center halo */}
          <div className="absolute h-[8rem] w-[8rem] rounded-full border-[8px] border-accent/40 bg-navy/[0.02] md:h-[11rem] md:w-[11rem]" />
        </div>

        {/* Letters & content placed clearly in front of the insignia */}
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-navy/5 px-4 py-1 text-xs font-bold uppercase tracking-widest text-navy shadow-2xs">
            <Sparkles className="h-3 w-3 text-navy" />
            <span>Extend the branch</span>
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Start your journey
          </h1>
        </div>
      </section>

      {/* Feature Cards with subtle navy borders & accents */}
      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`group rounded-[var(--radius)] border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 ${s.accent}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60 text-primary transition-colors group-hover:bg-navy/10 group-hover:text-navy">
              <s.icon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground transition-colors group-hover:text-navy">
              {s.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{s.text}</p>
          </Link>
        ))}
      </section>

      {/* About Us / What We Believe In Block */}
      <section
        aria-labelledby="about-believe-heading"
        className="mt-14 overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-soft"
      >
        <div className="grid divide-y divide-border md:grid-cols-12 md:divide-x md:divide-y-0">
          {/* About Us */}
          <div className="flex flex-col justify-between p-8 md:col-span-5 md:p-10">
            <div>
              <p className="text-sm font-bold text-navy">For Teens, by Teens</p>
              <h2
                id="about-believe-heading"
                className="mt-2 text-3xl font-bold tracking-tight text-foreground text-balance"
              >
                About Us &amp; What We Believe In
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Olive was created by teens, for teens who want a calmer, more honest way through
                everyday conflict—whether it&apos;s with a friend, sibling, classmate, or family
                member.
              </p>
            </div>
            <p className="mt-6 border-t border-border pt-5 text-sm font-semibold text-navy">
              A judgment-free space to pause, reflect, and repair.
            </p>
          </div>

          {/* What We Believe In */}
          <div className="bg-navy/[0.02] p-8 md:col-span-7 md:p-10">
            <h3 className="text-xl font-bold text-foreground">What We Believe In</h3>
            <p className="mt-3 text-base leading-relaxed text-foreground/90">
              Understanding your own emotions is key to understanding others. Our three-pronged
              approach offers teens a way to express their emotions in a way that will positively
              impact their present and future relationships.
            </p>

            <dl className="mt-7 grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-bold text-navy">01. Perspective</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Hear kind, honest opinions without pile-ons or public shaming.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-navy">02. Regulation</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Take a breath and steady your emotions before reacting.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-navy">03. Repair</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Extend the olive branch with clear words that leave room to move forward.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
