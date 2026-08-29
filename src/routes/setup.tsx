import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { WorkspaceScene } from "@/components/whi/workspace-scene";
import { useWorkspaceConfig } from "@/lib/workspace-config";
import {
  focusLength,
  personalize,
  profileList,
  type DeskSetup,
  type LightingPreference,
  type MonitorSetup,
  type WorkStyle,
} from "@/lib/whi-profile";
import { healthScore, recommend, statusOf, statusTone, type SensorReading } from "@/lib/whi";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Build your ideal workspace — WHI Setup" },
      {
        name: "description",
        content:
          "Choose how you work and how your desk is built. WHI keeps one intelligence engine and adapts its priorities, wording and focus rhythm to you.",
      },
      { property: "og:title", content: "Build your ideal workspace — WHI" },
      {
        property: "og:description",
        content:
          "Student, programmer, gamer or professional: shape the room, and WHI reshapes its guidance around you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SetupPage,
});

const monitorOptions: { id: MonitorSetup; label: string; note: string }[] = [
  { id: "single", label: "Single display", note: "One screen, one focal distance." },
  { id: "dual", label: "Dual display", note: "A second screen adds head rotation." },
  { id: "ultrawide", label: "Ultrawide", note: "Lower, longer — gentler on the neck." },
];

const deskOptions: { id: DeskSetup; label: string; note: string }[] = [
  { id: "sitting", label: "Seated desk", note: "Chair-supported posture." },
  { id: "standing", label: "Standing desk", note: "Surface rises, eye line rises." },
];

const lightOptions: { id: LightingPreference; label: string; note: string }[] = [
  { id: "lamp", label: "Task lamp", note: "Directed pool of light on the desk." },
  { id: "daylight", label: "Daylight", note: "Window-led room, watch for glare." },
  { id: "mixed", label: "Mixed", note: "Lamp and window balanced." },
];

const styleOptions: { id: WorkStyle; label: string; note: string }[] = [
  { id: "sprint", label: "Short sprints", note: "Frequent resets, high break emphasis." },
  { id: "balanced", label: "Balanced", note: "Moderate blocks with regular pauses." },
  { id: "focus", label: "Deep focus", note: "Long blocks, fewer but firmer breaks." },
];

function SetupPage() {
  const { profile, setProfile, setup, updateSetup } = useWorkspaceConfig();
  const [reading, setReading] = useState<SensorReading>(profile.reading);

  const score = healthScore(reading);
  const tone = statusTone(statusOf(score));
  const recs = useMemo(() => personalize(recommend(reading), profile), [reading, profile]);
  const top = recs.slice(0, 3);

  return (
    <main className="bg-deep pt-28 md:pt-32">
      <section className="mx-auto max-w-[1240px] px-6 md:px-10">
        <span className="label-eyebrow">Setup &amp; personalization</span>
        <h1 className="mt-4 max-w-[16ch] text-[42px] leading-[1.0] md:text-[76px]">
          Build your ideal workspace.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          One engine reads every desk the same way. What changes here is what WHI puts first, how it
          speaks to you, and the rhythm of your focus blocks — plus the room itself.
        </p>
      </section>

      {/* The room, built live from the choices below */}
      <section className="mx-auto mt-14 max-w-[1240px] px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_290px] lg:items-end">
          <div className="animate-fade">
            <WorkspaceScene reading={reading} setup={setup} />
          </div>
          <div className="lg:pb-2">
            <span className="label-eyebrow">Projected health</span>
            <div className="mt-3 flex items-end gap-2">
              <span
                className="display-num text-[92px] md:text-[116px]"
                style={{ color: tone.color, transition: "color 900ms ease" }}
              >
                {score}
              </span>
              <span className="mono-num pb-4 text-sm text-muted-foreground">/100</span>
            </div>
            <p className="mt-4 max-w-[34ch] text-sm text-muted-foreground">
              A typical {profile.label.toLowerCase()} session in this room.
            </p>
            <p className="mono-num mt-6 text-sm text-foreground">
              {focusLength(profile, setup)} min focus block
            </p>
            <p className="text-xs text-muted-foreground">then a 20-second distance rest</p>
          </div>
        </div>
      </section>

      {/* Who is sitting here */}
      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t pt-12">
          <span className="label-eyebrow">Who works here</span>
          <div className="mt-8 divide-y divide-border">
            {profileList.map((p) => {
              const active = p.id === profile.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setProfile(p.id);
                    setReading(p.reading);
                  }}
                  className="group grid w-full grid-cols-[16px_1fr_auto] items-center gap-x-6 py-6 text-left"
                >
                  <span
                    className="h-2 w-2 rounded-full transition-all duration-500"
                    style={{
                      background: active ? "var(--signal)" : "var(--border)",
                      transform: active ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                  <span>
                    <span
                      className="font-display text-[26px] transition-colors duration-500 md:text-[34px]"
                      style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      {p.label}
                    </span>
                    <span className="mt-1 block max-w-[54ch] text-sm text-muted-foreground">
                      {p.tagline}
                    </span>
                  </span>
                  <span className="mono-num text-xs text-muted-foreground">
                    {p.focusMinutes} min
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Physical configuration */}
      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t grid gap-x-16 gap-y-12 pt-12 md:grid-cols-2">
          <OptionRow
            label="Monitor setup"
            options={monitorOptions}
            value={setup.monitors}
            onSelect={(v) => updateSetup({ monitors: v })}
          />
          <OptionRow
            label="Desk arrangement"
            options={deskOptions}
            value={setup.desk}
            onSelect={(v) => updateSetup({ desk: v })}
          />
          <OptionRow
            label="Lighting preference"
            options={lightOptions}
            value={setup.lighting}
            onSelect={(v) => updateSetup({ lighting: v })}
          />
          <OptionRow
            label="Work style"
            options={styleOptions}
            value={setup.style}
            onSelect={(v) => updateSetup({ style: v })}
          />
        </div>
      </section>

      {/* What changes because of it */}
      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t pt-12">
          <span className="label-eyebrow">What WHI will emphasise for you</span>
          <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-foreground/90">
            {profile.voice}
          </p>
          <ol className="mt-8 divide-y divide-border">
            {top.map((r, i) => (
              <li
                key={r.id}
                className="animate-rise grid grid-cols-[28px_1fr_auto] items-start gap-x-5 py-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="mono-num pt-1 text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[17px] text-foreground">{r.title}</span>
                <span className="mono-num pt-1 text-sm text-muted-foreground">
                  priority {Math.round(((profile.priority as Record<string, number>)[r.key] ?? 1) * 100)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto mt-24 max-w-[1240px] px-6 pb-16 md:px-10">
        <div className="hairline-t pt-6 text-xs text-muted-foreground">
          Your setup travels with you across the Live Workspace, Science and Replay sections.
        </div>
      </footer>
    </main>
  );
}

function OptionRow<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { id: T; label: string; note: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div>
      <span className="label-eyebrow">{label}</span>
      <div className="mt-5 divide-y divide-border">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              className="grid w-full grid-cols-[10px_1fr] items-baseline gap-x-4 py-4 text-left"
            >
              <span
                className="mt-2 h-1.5 w-1.5 rounded-full transition-all duration-500"
                style={{
                  background: active ? "var(--signal)" : "var(--border)",
                  transform: active ? "scale(1.5)" : "scale(1)",
                }}
              />
              <span>
                <span
                  className="block text-[15px] transition-colors duration-500"
                  style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                >
                  {o.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{o.note}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
