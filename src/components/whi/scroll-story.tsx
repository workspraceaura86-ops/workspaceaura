import { useEffect, useMemo, useRef, useState } from "react";

import { WorkspaceScene, wideShot, type Camera } from "@/components/whi/workspace-scene";
import { useSmoothNumber } from "@/lib/use-smooth-number";
import {
  defaultReading,
  healthScore,
  metricList,
  metrics,
  statusOf,
  statusTone,
  subScore,
  zoneOf,
  type MetricKey,
  type SensorReading,
} from "@/lib/whi";

type Chapter = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  camera: Camera;
  focus: MetricKey | null;
  reading: SensorReading;
  /** Reads the story panel differently on the final chapter. */
  mode?: "score";
};

const ideal: SensorReading = { distance: 64, light: 430, temperature: 22, humidity: 47 };

const chapters: Chapter[] = [
  {
    id: "desk",
    eyebrow: "01 · The room",
    title: "It starts with the desk you already have.",
    body: "Four sensors sit on it — distance, light, temperature, humidity. Nothing else changes about how you work. Scroll, and the room shows you what it measures.",
    camera: wideShot,
    focus: null,
    reading: defaultReading,
  },
  {
    id: "ergonomics",
    eyebrow: "02 · Ergonomics",
    title: "The screen moves closer than you notice.",
    body: "An ultrasonic sensor tracks eye-to-screen distance in real time. At 38 cm the reading sits well below the recommended 55–75 cm range, and sustained near-focus viewing is the single largest contributor to end-of-day eye fatigue.",
    camera: { x: 430, y: 140, w: 780 },
    focus: "distance",
    reading: { ...defaultReading, distance: 38 },
  },
  {
    id: "light",
    eyebrow: "03 · Visual comfort",
    title: "Then the room goes dark around a bright screen.",
    body: "The ambient light sensor watches the window and the lamp together. At 55 lux your pupils fight the contrast between a lit display and an unlit room, every single blink.",
    camera: { x: 0, y: 20, w: 900 },
    focus: "light",
    reading: { ...defaultReading, distance: 38, light: 55 },
  },
  {
    id: "atmosphere",
    eyebrow: "04 · Atmosphere",
    title: "The air itself starts working against you.",
    body: "Temperature and humidity change the room's colour and density here — 29 °C and 71 % RH read as heavy, warm air. Concentration drops before you ever feel it.",
    camera: { x: 180, y: 60, w: 1020 },
    focus: null,
    reading: { distance: 38, light: 55, temperature: 29, humidity: 71 },
  },
  {
    id: "score",
    eyebrow: "05 · The signal",
    title: "Four readings become one number.",
    body: "Each channel is scored against its healthy band, weighted by how much it actually affects you, and combined. Correct the room and the score reforms in front of you.",
    camera: wideShot,
    focus: null,
    reading: ideal,
    mode: "score",
  },
  {
    id: "arrival",
    eyebrow: "06 · Arrival",
    title: "Now you are sitting at it.",
    body: "The camera stops where you work. From here the room stops being a story and becomes the instrument — every control below moves this same desk.",
    camera: { x: 300, y: 96, w: 860 },
    focus: null,
    reading: ideal,
  },
];

export const finalStoryReading = ideal;

export function ScrollStory({ onChapter }: { onChapter: (r: SensorReading) => void }) {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset["index"]);
            setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    nodes.current.forEach((n) => n && io.observe(n));
    return () => io.disconnect();
  }, []);

  const chapter = chapters[active]!;

  useEffect(() => {
    onChapter(chapter.reading);
  }, [chapter, onChapter]);

  const score = healthScore(chapter.reading);
  const smooth = useSmoothNumber(score, 0.08);
  const tone = statusTone(statusOf(score));

  const contributions = useMemo(
    () =>
      metricList.map((m) => ({
        key: m.key,
        label: m.label,
        weight: m.weight,
        sub: subScore(m.key, chapter.reading[m.key]),
        points: subScore(m.key, chapter.reading[m.key]) * m.weight,
      })),
    [chapter],
  );

  return (
    <section className="relative">
      {/* the stage — one continuous camera on one room */}
      <div className="pointer-events-none sticky top-0 flex h-svh items-center overflow-hidden bg-deep">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full scale-[1.75] md:scale-100">
            <WorkspaceScene
              reading={chapter.reading}
              camera={chapter.camera}
              focus={chapter.focus}
              showReadouts={false}
            />
          </div>
        </div>

        {/* legibility falloff, not decoration */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--deep) 70%, transparent) 0%, transparent 24%, transparent 44%, color-mix(in oklab, var(--deep) 90%, transparent) 100%), linear-gradient(270deg, color-mix(in oklab, var(--deep) 88%, transparent) 0%, color-mix(in oklab, var(--deep) 74%, transparent) 42%, transparent 72%)",
          }}
        />

        {/* instrument strip: always reading, like a real device */}
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-1 px-6 pt-24 md:px-10">
          {metricList.map((m) => {
            const v = chapter.reading[m.key];
            const s = subScore(m.key, v);
            const lit = chapter.focus === m.key;
            return (
              <div
                key={m.key}
                className="flex items-baseline gap-2"
                style={{ opacity: chapter.focus && !lit ? 0.4 : 1, transition: "opacity 700ms ease" }}
              >
                <span className="label-eyebrow">{m.label}</span>
                <span
                  className="mono-num text-sm"
                  style={{
                    color:
                      s > 82
                        ? "var(--state-excellent)"
                        : s > 55
                          ? "var(--state-warn)"
                          : "var(--state-poor)",
                    transition: "color 700ms ease",
                  }}
                >
                  {m.key === "temperature" ? v.toFixed(1) : Math.round(v)}
                  {m.unit === "%" ? "%" : ` ${m.unit}`}
                </span>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {zoneOf(m.key, v)}
                </span>
              </div>
            );
          })}
        </div>

        {/* chapter progress rail */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          {chapters.map((c, i) => (
            <span
              key={c.id}
              className="h-6 w-px"
              style={{
                background: i === active ? "var(--signal)" : "var(--hairline)",
                transition: "background 600ms ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* the copy, scrolling over the room */}
      <div className="relative -mt-[100svh]">
        {chapters.map((c, i) => (
          <div
            key={c.id}
            data-index={i}
            ref={(n) => {
              nodes.current[i] = n;
            }}
            className="flex h-svh items-center"
          >
            <div className="mx-auto w-full max-w-[1240px] px-6 md:px-10">
              <div
                className="max-w-[30rem] lg:ml-auto"
                style={{
                  opacity: i === active ? 1 : 0.16,
                  transform: `translateY(${i === active ? 0 : 14}px)`,
                  transition: "opacity 700ms ease, transform 700ms cubic-bezier(.22,1,.36,1)",
                }}
              >
                <span className="label-eyebrow">{c.eyebrow}</span>
                <h2 className="mt-4 text-[32px] leading-[1.06] md:text-[46px]">{c.title}</h2>
                <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>

                {c.mode === "score" && (
                  <div className="mt-8">
                    <div className="flex items-end gap-2">
                      <span
                        className="display-num text-[88px] md:text-[104px]"
                        style={{ color: tone.color, transition: "color 900ms ease" }}
                      >
                        {Math.round(smooth)}
                      </span>
                      <span className="mono-num pb-3 text-sm text-muted-foreground">/100</span>
                    </div>
                    <div className="mt-5 divide-y divide-border">
                      {contributions.map((c2) => (
                        <div key={c2.key} className="flex items-center gap-4 py-2.5">
                          <span className="w-36 text-xs text-foreground/80">{c2.label}</span>
                          <span className="relative h-px flex-1 bg-border">
                            <span
                              className="absolute inset-y-0 left-0"
                              style={{
                                width: `${c2.sub}%`,
                                background: "var(--signal)",
                                transition: "width 1200ms cubic-bezier(.22,1,.36,1)",
                              }}
                            />
                          </span>
                          <span className="mono-num w-16 text-right text-xs text-muted-foreground">
                            +{c2.points.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Weighted by impact: {metricList
                        .map((m) => `${metrics[m.key].label.toLowerCase()} ${Math.round(m.weight * 100)}%`)
                        .join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
