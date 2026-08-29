import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Live Workspace" },
  { to: "/setup", label: "Setup" },
  { to: "/science", label: "Science" },
  { to: "/replay", label: "Replay" },
] as const;

/**
 * Device-style top rail. Present on every page so the four sections read as
 * one product rather than four sites.
 */
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-deep via-deep/70 to-transparent" />
      <nav className="relative mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-5 md:px-10">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-display text-[15px] tracking-[0.34em] text-foreground">WHI</span>
          <span className="hidden text-xs text-muted-foreground lg:inline">
            Workspace Health Intelligence
          </span>
        </Link>

        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="text-[13px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                <span className="relative">
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-signal transition-transform duration-500 [a[data-status=active]_&]:scale-x-100" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
