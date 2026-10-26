import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

const links = [
  { to: "/stories", label: "Stories" },
  { to: "/calm", label: "Calm Down" },
  { to: "/reach-out", label: "Reach Out" },
] as const;

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
      <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
        <Leaf className="h-6 w-6 text-primary" /> Common Ground
      </Link>
      <nav className="flex gap-1 rounded-full bg-card/70 p-1 shadow-soft">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
