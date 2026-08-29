import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Clipboard,
  Cloud,
  Droplets,
  Eye,
  FileLock2,
  Fingerprint,
  Globe,
  Keyboard,
  Mic,
  Radio,
  Ruler,
  ShieldCheck,
  Sun,
  Thermometer,
  X,
} from "lucide-react";

import { WorkspaceScene, type Camera as SceneCamera } from "@/components/whi/workspace-scene";
import { useWorkspaceConfig } from "@/lib/workspace-config";
import { defaultReading, type MetricKey, type SensorReading } from "@/lib/whi";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "The science behind WHI — how your workspace is read" },
      {
        name: "description",
        content:
          "Four sensors, one score: how WHI turns screen distance, light, temperature and humidity into plain-language guidance — and exactly what it never collects.",
      },
      { property: "og:title", content: "How WHI works — sensing, analysis, guidance" },
      {
        property: "og:description",
        content:
          "Watch the sensors appear around a real desk, follow the data into the score, and read our privacy and security commitments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SciencePage,
});

type Step = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  camera: SceneCamera;
  focus: MetricKey | null;
  reading: SensorReading;
  /** How many sensors have come online by this step. */
  sensors: number;
  /** Show the data path from sensors to the score. */
  flow: boolean;
};

const steps: Step[] = [
  {
    id: "matters",
    eyebrow: "01 · Why it matters",
    title: "Most desk fatigue is environmental, not personal.",
    body: "Sore eyes, a stiff neck and a mid-afternoon slump are usually the room's doing: a screen too close, a light level too low, air too warm or too dry. None of it announces itself — you simply feel worse by evening.",
    camera: { x: 0, y: 0, w: 1200 },
    focus: null,
    reading: defaultReading,
    sensors: 0,
    flow: false,
  },
  {
    id: "sense",
    eyebrow: "02 · Sensors collect",
    title: "Four quiet instruments watch the conditions.",
    body: "An ultrasonic ranger measures eye-to-screen distance. A light sensor reads ambient lux. A combined temperature and humidity probe reads the air. They sample continuously and send nothing but numbers.",
    camera: { x: 120, y: 20, w: 1000 },
    focus: null,
    reading: defaultReading,
    sensors: 4,
    flow: false,
  },
  {
    id: "ergonomics",
    eyebrow: "03 · Ergonomic principle",
    title: "Your eyes want roughly an arm's length.",
    body: "Between 55 and 75 cm, the focusing muscle inside your eye can rest between saccades. Closer than that and it holds a contraction for hours, which is what end-of-day blur actually is.",
    camera: { x: 430, y: 140, w: 780 },
    focus: "distance",
    reading: { ...defaultReading, distance: 38 },
    sensors: 4,
    flow: false,
  },
  {
    id: "eyes",
    eyebrow: "04 · Eye comfort principle",
    title: "A bright screen in a dark room is the hardest ask.",
    body: "Your pupil can only pick one aperture. When the room sits far below the display, every blink forces a re-adaptation. Around 300–600 lux of ambient light removes the conflict entirely.",
    camera: { x: 0, y: 20, w: 900 },
    focus: "light",
    reading: { ...defaultReading, distance: 38, light: 55 },
    sensors: 4,
    flow: false,
  },
  {
    id: "air",
    eyebrow: "05 · Environmental principle",
    title: "Warm, heavy air costs concentration before you notice.",
    body: "Above 24.5 °C sustained attention measurably declines, and below 40% humidity the tear film covering your eyes evaporates faster than you can blink it back. Comfort here is not a luxury metric.",
    camera: { x: 180, y: 60, w: 1020 },
    focus: null,
    reading: { distance: 38, light: 55, temperature: 29, humidity: 71, aqi: 34 },
    sensors: 4,
    flow: false,
  },
  {
    id: "score",
    eyebrow: "06 · One score, one explanation",
    title: "The four signals become a single number — and a sentence.",
    body: "Each reading is scored against its healthy band, weighted by how much it affects you, and combined into 0–100. Every movement in that number is traced back to the channel that caused it, in plain words.",
    camera: { x: 0, y: 0, w: 1200 },
    focus: null,
    reading: { distance: 64, light: 430, temperature: 22, humidity: 46, aqi: 34 },
    sensors: 4,
    flow: true,
  },
];

/** Sensor node positions in scene coordinates (scene is 1200x620). */
const nodes: { key: MetricKey; x: number; y: number; label: string }[] = [
  { key: "distance", x: 700, y: 214, label: "Distance" },
  { key: "light", x: 300, y: 132, label: "Light" },
  { key: "temperature", x: 1052, y: 214, label: "Temp" },
  { key: "humidity", x: 1052, y: 300, label: "Humidity" },
];

function SensorOverlay({ count, flow, active }: { count: number; flow: boolean; active: MetricKey | null }) {
  return (
    <g>
      {nodes.map((n, i) => {
        const on = i < count;
        const lit = !active || active === n.key;
        return (
          <g
            key={n.key}
            style={{
              opacity: on ? (lit ? 1 : 0.3) : 0,
              transition: `opacity 700ms ease ${i * 140}ms`,
            }}
          >
            <circle cx={n.x} cy={n.y} r="26" fill="none" stroke="var(--signal)" strokeOpacity="0.25" />
            <circle cx={n.x} cy={n.y} r="5" fill="var(--signal)" />
            <text
              x={n.x}
              y={n.y - 38}
              textAnchor="middle"
              fill="var(--signal)"
              style={{ fontFamily: "var(--font-mono)", fontSize: 15, letterSpacing: "0.12em" }}
            >
              {n.label.toUpperCase()}
            </text>
            {flow && (
              <line
                x1={n.x}
                y1={n.y}
                x2="600"
                y2="560"
                stroke="var(--signal)"
                strokeWidth="1"
                strokeDasharray="4 10"
                strokeOpacity="0.5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="28"
                  to="0"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </line>
            )}
          </g>
        );
      })}
      {flow && (
        <g style={{ transition: "opacity 700ms ease" }}>
          <circle cx="600" cy="560" r="34" fill="none" stroke="var(--signal)" strokeOpacity="0.5" />
          <text
            x="600"
            y="568"
            textAnchor="middle"
            fill="var(--foreground)"
            style={{ fontFamily: "var(--font-display)", fontSize: 26, letterSpacing: "-0.04em" }}
          >
            88
          </text>
        </g>
      )}
    </g>
  );
}

function SciencePage() {
  const { setup } = useWorkspaceConfig();
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset['idx']);
            if (!Number.isNaN(idx)) setI(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const step = steps[i]!;

  return (
    <main className="bg-deep">
      <section className="mx-auto max-w-[1240px] px-6 pt-32 md:px-10 md:pt-40">
        <span className="label-eyebrow">Science &amp; how WHI works</span>
        <h1 className="mt-4 max-w-[17ch] text-[42px] leading-[1.0] md:text-[76px]">
          Nothing here is a guess.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          Scroll once and you will see the whole chain: conditions, sensing, analysis, score,
          guidance. No dashboards, no jargon — just the reasoning we use.
        </p>
      </section>

      {/* Sticky stage: the same room, with sensors coming online */}
      <div className="relative mt-16">
        <div className="pointer-events-none sticky top-0 h-svh">
          <div className="flex h-full items-center">
            <div className="mx-auto w-full max-w-[1400px] px-0 md:px-6">
              <WorkspaceScene
                reading={step.reading}
                camera={step.camera}
                focus={step.focus}
                setup={setup}
                showReadouts={false}
                overlay={<SensorOverlay count={step.sensors} flow={step.flow} active={step.focus} />}
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/70 to-transparent md:via-deep/40" />
        </div>

        <div className="relative -mt-[100svh]">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              data-idx={idx}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              className="flex min-h-svh items-center"
            >
              <div className="mx-auto w-full max-w-[1240px] px-6 md:px-10">
                <div
                  className="max-w-[38ch] transition-all duration-700"
                  style={{ opacity: idx === i ? 1 : 0.28 }}
                >
                  <span className="label-eyebrow">{s.eyebrow}</span>
                  <h2 className="mt-4 text-[30px] leading-[1.1] md:text-[46px]">{s.title}</h2>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                    {s.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The chain, stated plainly */}
      <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
        <div className="hairline-t pt-12">
          <span className="label-eyebrow">The whole chain</span>
          <ol className="mt-8 divide-y divide-border">
            {[
              ["Workspace conditions", "The room as it actually is, moment to moment."],
              ["Sensors collect", "Distance, light, temperature, humidity — numbers only."],
              ["Data analysis", "Each reading scored against its healthy band and weighted."],
              ["Workspace Health Score", "One 0–100 figure you can watch move in real time."],
              ["Actionable recommendations", "Ranked by the points you would actually recover."],
            ].map(([title, body], n) => (
              <li key={title} className="grid grid-cols-[36px_1fr] items-baseline gap-x-6 py-6">
                <span className="mono-num text-xs text-muted-foreground">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[19px] text-foreground">{title}</span>
                  <span className="mt-1.5 block max-w-[62ch] text-sm text-muted-foreground">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PrivacyDashboard />
      <DataSecurity />

      <footer className="mx-auto mt-24 max-w-[1240px] px-6 pb-16 md:px-10">
        <div className="hairline-t pt-6 text-xs text-muted-foreground">
          This page is maintained by the WHI team to answer common privacy and security questions
          about the product. It describes our design commitments, not an independent certification.
        </div>
      </footer>
    </main>
  );
}

/* --------------------------------- Privacy ---------------------------------- */

const collected = [
  { icon: Ruler, label: "Screen distance", note: "Centimetres from eye to display." },
  { icon: Sun, label: "Ambient lighting", note: "Room brightness in lux." },
  { icon: Thermometer, label: "Temperature", note: "Air temperature in °C." },
  { icon: Droplets, label: "Humidity", note: "Relative humidity as a percentage." },
];

const notCollected = [
  { icon: Camera, label: "Camera recordings", note: "There is no camera in the module." },
  { icon: Mic, label: "Microphone recordings", note: "No audio is captured, ever." },
  { icon: Keyboard, label: "Keystrokes", note: "WHI cannot see what you type." },
  { icon: Clipboard, label: "Clipboard contents", note: "Never read, never stored." },
  { icon: Globe, label: "Browsing history", note: "Your activity is not our business." },
  { icon: FileLock2, label: "Personal files", note: "No access to anything on your machine." },
];

function PrivacyDashboard() {
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
      <div className="hairline-t pt-12">
        <span className="label-eyebrow">Privacy dashboard</span>
        <h2 className="mt-4 max-w-[22ch] text-[30px] leading-[1.12] md:text-[44px]">
          Four numbers. That is the entire dataset.
        </h2>
        <p className="mt-5 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
          WHI is a hardware sensor module, not a monitoring tool. It can only measure what its four
          instruments physically sense — and it was designed that way deliberately.
        </p>

        <div className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4" style={{ color: "var(--state-excellent)" }} />
              <span className="label-eyebrow">What WHI collects</span>
            </div>
            <ul className="mt-6 divide-y divide-border">
              {collected.map(({ icon: Icon, label, note }) => (
                <li key={label} className="flex items-start gap-4 py-4">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-signal" />
                  <span>
                    <span className="block text-[15px] text-foreground">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <X className="h-4 w-4" style={{ color: "var(--state-poor)" }} />
              <span className="label-eyebrow">What WHI never collects</span>
            </div>
            <ul className="mt-6 divide-y divide-border">
              {notCollected.map(({ icon: Icon, label, note }) => (
                <li key={label} className="flex items-start gap-4 py-4 opacity-70">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-[15px] text-foreground/80 line-through decoration-muted-foreground/50">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Security ---------------------------------- */

const security = [
  {
    icon: Radio,
    title: "Secure device communication",
    body: "Readings leave the sensor module over an encrypted connection. Nothing travels as plain text between your desk and the cloud.",
  },
  {
    icon: Fingerprint,
    title: "Authenticated hardware",
    body: "Each module carries its own credentials, so only your device can write readings to your workspace history.",
  },
  {
    icon: Cloud,
    title: "Protected cloud storage",
    body: "Session history is stored encrypted at rest, scoped to your workspace, and never shared with third parties.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first design",
    body: "The privacy decision was made in the hardware: no camera, no microphone, no software agent on your computer.",
  },
  {
    icon: Eye,
    title: "Minimal collection",
    body: "We keep the four environmental values and nothing else — no identity, no content, no activity trail.",
  },
];

function DataSecurity() {
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-6 md:px-10">
      <div className="hairline-t pt-12">
        <span className="label-eyebrow">Data security</span>
        <h2 className="mt-4 max-w-[24ch] text-[30px] leading-[1.12] md:text-[44px]">
          Your desk data should be as private as your desk.
        </h2>

        <ol className="mt-10 divide-y divide-border">
          {security.map(({ icon: Icon, title, body }, n) => (
            <li
              key={title}
              className="animate-rise grid grid-cols-[28px_1fr] items-start gap-x-6 py-6 md:grid-cols-[28px_260px_1fr]"
              style={{ animationDelay: `${n * 70}ms` }}
            >
              <Icon className="mt-1 h-[18px] w-[18px] text-signal" />
              <span className="text-[17px] text-foreground">{title}</span>
              <span className="col-span-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground md:col-span-1">
                {body}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
