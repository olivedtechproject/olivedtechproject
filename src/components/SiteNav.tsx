import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

const links = [
  { to: "/stories", label: "Am I in the Wrong?" },
  { to: "/calm", label: "Cool Down" },
  { to: "/reach-out", label: "Reach Out" },
] as const;

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
      <Link to="/" className="group flex items-center gap-2.5 font-display text-foreground">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/25 bg-navy/5 text-primary shadow-2xs transition-colors group-hover:border-navy group-hover:bg-navy/10 group-hover:text-navy">
          <Leaf className="h-5 w-5" />
        </div>
        <span className="leading-none">
          <span className="block text-2xl font-bold tracking-tight">Olive</span>
          <span className="block text-[11px] font-bold tracking-wider text-navy">
            extend the branch
          </span>
        </span>
      </Link>
      <nav className="flex gap-1 rounded-full border border-border/80 bg-card/80 p-1 shadow-soft backdrop-blur-xs">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{
              className:
                "bg-primary text-primary-foreground hover:text-primary-foreground shadow-2xs",
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
