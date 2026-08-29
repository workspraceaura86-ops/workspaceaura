import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WorkspaceScene } from "@/components/whi/workspace-scene";
import { ScrollStory } from "@/components/whi/scroll-story";
import { ControlDeck } from "@/components/whi/control-deck";
import { Narrative } from "@/components/whi/narrative";
import { Guidance } from "@/components/whi/guidance";
import { BreakTimer } from "@/components/whi/break-timer";
import { Analytics, type HistoryPoint } from "@/components/whi/analytics";
import { DataFlow } from "@/components/whi/data-flow";
import { HardwareStatus } from "@/components/whi/hardware-status";
import { ScoreRing } from "@/components/whi/score-ring";
import { useWorkspaceConfig } from "@/lib/workspace-config";
import { focusLength, personalize } from "@/lib/whi-profile";
import {
  defaultReading,
  explain,
  healthScore,
  recommend,
  statusOf,
  statusTone,
  type MetricKey,
  type Reasoning,
  type SensorReading,
} from "@/lib/whi";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WHI — The desk that tells you how it feels" },
      {
        name: "description",
        content:
          "Workspace Health Intelligence reads screen distance, light, temperature and humidity, renders your desk as a living scene, and explains in plain language why your health score moved.",
      },
      { property: "og:title", content: "WHI — Workspace Health Intelligence" },
      {
        property: "og:description",
        content:
          "A scroll-driven look inside one desk: the room dims, warms and shifts as four sensors read it, and one score forms from the signals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, setup } = useWorkspaceConfig();
  const [reading, setReading] = useState<SensorReading>(defaultReading);
  const prevRef = useRef<SensorReading>(defaultReading);
  const [reasoning, setReasoning] = useState<Reasoning>(() => explain(defaultReading, defaultReading));
  const [stamp, setStamp] = useState(0);
  const [history, setHistory] = useState<HistoryPoint[]>([
    { t: 0, score: healthScore(defaultReading), ...defaultReading },
  ]);
  const [breaks, setBreaks] = useState(0);
  const startedAt = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** How long viewing distance has stayed below the recommended band. */
  const closeSince = useRef<number | null>(null);
  const [sustainedCloseMs, setSustainedCloseMs] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const score = healthScore(reading);
  const status = statusOf(score);
  const tone = statusTone(status);

  /** Single commit point: swap for the Firebase subscription when hardware lands. */
  const applyReading = useCallback((next: SensorReading) => {
    setReading(next);
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      setReasoning(explain(prevRef.current, next));
      setStamp((s) => s + 1);
      prevRef.current = next;
    }, 520);
  }, []);

  const onChange = useCallback(
    (key: MetricKey, value: number) => applyReading({ ...reading, [key]: value }),
    [reading, applyReading],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((h) => [...h.slice(-119), { t: Date.now(), score: healthScore(reading), ...reading }]);
      if (reading.distance < 55) {
        closeSince.current ??= Date.now();
        setSustainedCloseMs(Date.now() - closeSince.current);
      } else {
        closeSince.current = null;
        setSustainedCloseMs(0);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [reading]);

  const recs = useMemo(
    () => personalize(recommend(reading, sustainedCloseMs), profile),
    [reading, sustainedCloseMs, profile],
  );

  /** Subtle dolly: the tighter the viewing distance, the closer the camera sits. */
  const closeness = Math.max(0, Math.min(1, (72 - reading.distance) / 40));
  const camera = {
    x: Math.round(70 * closeness),
    y: Math.round(34 * closeness),
    w: Math.round(1200 - 150 * closeness),
  };


  return (
    <main className="bg-deep">
      {/* OPENING — one line, then the room takes over */}
      <section className="relative flex h-svh items-end">
        <div className="mx-auto w-full max-w-[1240px] px-6 pb-16 md:px-10 md:pb-24">
          <span className="mono-num mb-6 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-breath rounded-full" style={{ background: tone.color }} />
            Sensing · {profile.label} profile
          </span>
          <h1 className="max-w-[18ch] text-[46px] leading-[0.98] md:text-[84px]">
            Your workspace has been
            <span className="block text-muted-foreground">telling you something.</span>
          </h1>
          <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
            WHI is a four-sensor module and a piece of software that reads the room around your
            screen — and explains, in words, why it is helping or hurting you.
          </p>
          <p className="label-eyebrow mt-10 animate-breath">Scroll</p>
        </div>
      </section>

      {/* THE STORY — one continuous camera move through the desk */}
      <ScrollStory onChapter={applyReading} />

      {/* HANDOVER — the room becomes yours to drive */}
      <section className="mx-auto max-w-[1240px] px-6 pt-24 md:px-10 md:pt-32">
        <span className="label-eyebrow">Now you drive it</span>
        <h2 className="mt-4 max-w-[20ch] text-[34px] leading-[1.05] md:text-[52px]">
          Take the controls and watch the room answer.
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px] lg:items-end">
          <div className="animate-fade">
            <WorkspaceScene reading={reading} setup={setup} camera={camera} />
          </div>
          <div className="lg:pb-2">
            <span className="label-eyebrow">Workspace health</span>
            <div className="mt-4">
              <ScoreRing score={score} />
            </div>
            <p className="mt-4 text-sm" style={{ color: tone.color, transition: "color 900ms ease" }}>
              {status}
            </p>
            <div className="mt-8">
              <DataFlow stamp={stamp} label={`${score} pts committed`} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t grid gap-16 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-24">
          <ControlDeck reading={reading} onChange={onChange} onPreset={applyReading} />
          <Narrative reasoning={reasoning} reading={reading} stamp={stamp} />
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t grid gap-16 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-24">
          <Guidance items={recs} note={profile.voice} stamp={stamp} />
          <HardwareStatus reading={reading} mode="simulation" />
        </div>

      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t grid gap-16 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-24">
          <BreakTimer
            focusMinutes={focusLength(profile, setup)}
            onBreakComplete={() => setBreaks((b) => b + 1)}
          />
          <div>
            <span className="label-eyebrow">Session</span>
            <h2 className="mt-4 max-w-[20ch] text-[30px] leading-[1.12] md:text-[40px]">
              A record builds quietly while you work.
            </h2>
            <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
              WHI samples your environment continuously. The history below is the same reading
              stream the hardware pipeline will produce — sensors, NodeMCU, cloud, screen.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t pt-12">
          <Analytics history={history} reading={reading} breaks={breaks} startedAt={startedAt.current} />
        </div>
      </section>

      <footer className="mx-auto mt-24 max-w-[1240px] px-6 pb-16 md:px-10">
        <div className="hairline-t pt-6 text-xs text-muted-foreground">
          Prototype · simulated sensor inputs. The reading contract is hardware-ready.
        </div>
      </footer>
    </main>
  );
}
