import type { ReactNode } from "react";

import { metrics, subScore, zoneOf, type MetricKey, type SensorReading } from "@/lib/whi";
import { defaultSetup, type WorkspaceSetup } from "@/lib/whi-profile";

/** A camera framing expressed in scene coordinates (scene is 1200x620). */
export type Camera = { x: number; y: number; w: number };

export const wideShot: Camera = { x: 0, y: 0, w: 1200 };

/**
 * Side-elevation view of the actual desk. Everything you see is a sensor:
 * distance moves the person, light sets the exposure of the whole room,
 * temperature tints the air, humidity thickens it.
 *
 * `camera` dollies and zooms the whole room; `focus` fades everything that is
 * not the subject of the current chapter so the object being explained leads.
 */
export function WorkspaceScene({
  reading,
  camera = wideShot,
  focus = null,
  showReadouts = true,
  cover = false,
  setup = defaultSetup,
  overlay,
}: {
  reading: SensorReading;
  camera?: Camera;
  focus?: MetricKey | null;
  showReadouts?: boolean;
  /** Fill the parent like a background plate instead of fitting inside it. */
  cover?: boolean;
  /** Physical configuration of the desk — changes what is actually built. */
  setup?: WorkspaceSetup;
  /** Extra SVG drawn in scene coordinates on top of the room. */
  overlay?: ReactNode;
}) {
  const { distance, light, temperature, humidity } = reading;

  const zoom = 1200 / camera.w;
  const camStyle = {
    transform: `scale(${zoom.toFixed(4)}) translate(${(-camera.x).toFixed(1)}px, ${(-camera.y).toFixed(1)}px)`,
    transformOrigin: "0 0",
    transition: "transform 1400ms cubic-bezier(.65,0,.2,1)",
  } as const;

  /** Opacity for a group that is not the current subject. */
  const sub = (...keys: MetricKey[]) =>
    !focus || keys.includes(focus) ? 1 : 0.28;

  /** Standing desks lift the whole work surface — everything on it follows. */
  const lift = setup.desk === "standing" ? -74 : 0;
  const screenX = 828;
  const personX = screenX - distance * 4.7;
  const eyeY = 274 + lift;

  const lampGain = setup.lighting === "lamp" ? 1.35 : setup.lighting === "daylight" ? 0.25 : 1;
  const windowGain = setup.lighting === "daylight" ? 1.35 : setup.lighting === "lamp" ? 0.35 : 1;

  const lux = Math.min(light, 1000);
  const exposure = 0.14 + Math.pow(lux / 1000, 0.62) * 0.86; // 0..1
  const glare = Math.max(0, (light - 640) / 360) * windowGain;
  const warm = Math.max(-1, Math.min(1, (temperature - 22.5) / 8)); // -1 cold .. 1 hot
  const haze = Math.max(0, Math.min(1, (humidity - 52) / 38));
  const dry = Math.max(0, Math.min(1, (42 - humidity) / 32));

  const cast =
    warm >= 0
      ? `oklch(0.72 ${(0.1 * warm).toFixed(3)} 48)`
      : `oklch(0.72 ${(0.1 * -warm).toFixed(3)} 248)`;

  const distScore = subScore("distance", distance);
  const distTone =
    distScore > 82 ? "var(--state-excellent)" : distScore > 55 ? "var(--state-warn)" : "var(--state-poor)";

  const ease = "1100ms cubic-bezier(.22,1,.36,1)";

  /** Screen height in the side elevation: ultrawide is lower and longer. */
  const screenH = setup.monitors === "ultrawide" ? 132 : 166;

  return (
    <div
      className={
        cover
          ? "absolute inset-0 isolate overflow-hidden bg-deep"
          : "relative isolate w-full overflow-hidden rounded-[28px] bg-deep"
      }
    >
      <svg
        viewBox="0 0 1200 620"
        preserveAspectRatio={cover ? "xMidYMid slice" : "xMidYMid meet"}
        className="block h-full w-full"
        role="img"
        aria-label="Live side view of your workspace"
      >
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.30 0.008 62)" />
            <stop offset="100%" stopColor="oklch(0.16 0.006 62)" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.24 0.008 62)" />
            <stop offset="100%" stopColor="oklch(0.14 0.006 62)" />
          </linearGradient>
          <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.95 0.09 78)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.95 0.09 78)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="screenFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.05 210)" />
            <stop offset="100%" stopColor="oklch(0.42 0.04 220)" />
          </linearGradient>
          <linearGradient id="windowLight" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="oklch(0.96 0.05 82)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="oklch(0.96 0.05 82)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="screenSpill" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.8 0.06 215)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.8 0.06 215)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g style={camStyle}>


        {/* room */}
        <g style={{ opacity: 0.25 + exposure * 0.75, transition: `opacity ${ease}` }}>
          <rect x="0" y="0" width="1200" height="470" fill="url(#wall)" />
          <rect x="0" y="470" width="1200" height="150" fill="url(#floor)" />
          <line x1="0" y1="470" x2="1200" y2="470" stroke="oklch(0.99 0 0 / 10%)" strokeWidth="1" />
        </g>

        {/* window — the ambient light source */}
        <g style={{ opacity: sub("light"), transition: "opacity 900ms ease" }}>

          <rect
            x="70"
            y="86"
            width="212"
            height="250"
            rx="6"
            fill="oklch(0.96 0.05 82)"
            style={{ opacity: (0.06 + exposure * 0.72) * windowGain, transition: `opacity ${ease}` }}
          />
          <rect x="70" y="86" width="212" height="250" rx="6" fill="none" stroke="oklch(0.99 0 0 / 16%)" />
          <line x1="176" y1="86" x2="176" y2="336" stroke="oklch(0.15 0 0 / 55%)" strokeWidth="4" />
          <line x1="70" y1="211" x2="282" y2="211" stroke="oklch(0.15 0 0 / 55%)" strokeWidth="4" />
          <polygon
            points="282,110 700,470 282,470"
            fill="url(#windowLight)"
            style={{ opacity: (0.06 + exposure * 0.5) * windowGain, transition: `opacity ${ease}` }}
          />
        </g>

        {/* desk lamp */}
        <g style={{ opacity: sub("light"), transition: "opacity 900ms ease" }}>

          <g style={{ transform: `translateY(${lift}px)`, transition: `transform ${ease}` }}>
            <line x1="920" y1={470 - lift} x2="920" y2="196" stroke="oklch(0.55 0.01 62)" strokeWidth="5" strokeLinecap="round" />
            <line x1="920" y1="196" x2="836" y2="168" stroke="oklch(0.55 0.01 62)" strokeWidth="5" strokeLinecap="round" />
            <path d="M812 154 L862 172 L840 200 L800 182 Z" fill="oklch(0.42 0.01 62)" />
          </g>
          <polygon
            points={`806,${190 + lift} 848,${204 + lift} 940,470 690,470`}
            fill="url(#lampCone)"
            style={{ opacity: (0.1 + exposure * 0.55) * lampGain, transition: `opacity ${ease}` }}
          />
        </g>

        {/* desk — rises for a standing setup */}
        <g style={{ transform: `translateY(${lift}px)`, transition: `transform ${ease}` }}>
          <rect x="560" y="456" width="560" height="16" rx="4" fill="oklch(0.34 0.014 64)" />
          <rect x="560" y="456" width="560" height="4" rx="2" fill="oklch(0.62 0.02 66)" opacity="0.5" />
          <rect x="1084" y="472" width="14" height={148 - lift} fill="oklch(0.24 0.01 62)" />
          <rect x="586" y="472" width="14" height={148 - lift} fill="oklch(0.24 0.01 62)" />
        </g>

        {/* monitor(s) — configuration is physically built, not labelled */}
        <g style={{ transform: `translateY(${lift}px)`, transition: `transform ${ease}` }}>
          <rect x="828" y="472" width="150" height="10" rx="5" fill="oklch(0.3 0.01 62)" />
          <rect x="890" y="392" width="18" height="82" fill="oklch(0.3 0.01 62)" />
          <rect
            x="820"
            y={398 - screenH}
            width="14"
            height={screenH}
            rx="6"
            fill="oklch(0.28 0.01 62)"
            style={{ transition: `all ${ease}` }}
          />
          <rect
            x="834"
            y={402 - screenH}
            width="8"
            height={screenH - 8}
            fill="url(#screenFace)"
            style={{ opacity: 0.55 + exposure * 0.25, transition: `all ${ease}` }}
          />
          {/* second display, angled behind the primary */}
          <g
            style={{
              opacity: setup.monitors === "dual" ? 1 : 0,
              transition: `opacity ${ease}`,
            }}
          >
            <rect x="1000" y="472" width="110" height="9" rx="4" fill="oklch(0.3 0.01 62)" />
            <rect x="1046" y="410" width="14" height="64" fill="oklch(0.3 0.01 62)" />
            <rect x="1024" y="266" width="12" height="146" rx="6" fill="oklch(0.26 0.01 62)" transform="rotate(7 1030 340)" />
            <rect
              x="1036"
              y="272"
              width="7"
              height="134"
              fill="url(#screenFace)"
              transform="rotate(7 1040 340)"
              style={{ opacity: 0.45 + exposure * 0.25, transition: `opacity ${ease}` }}
            />
          </g>
          <ellipse
            cx="770"
            cy="315"
            rx="150"
            ry="130"
            fill="url(#screenSpill)"
            style={{ opacity: 0.55 - exposure * 0.28, transition: `opacity ${ease}` }}
          />
        </g>

        {/* keyboard */}
        <rect
          x="660"
          y={450 + lift}
          width="128"
          height="8"
          rx="3"
          fill="oklch(0.3 0.01 62)"
          style={{ transition: `all ${ease}` }}
        />

        {/* person silhouette — moves with measured distance */}
        <g
          style={{
            transform: `translate(${(personX - 30).toFixed(1)}px, ${lift}px)`,
            opacity: sub("distance"),
            transition: `transform ${ease}, opacity 900ms ease`,
          }}
        >

          <g fill="oklch(0.1 0.006 62)">
            {/* chair — absent when standing */}
            <g style={{ opacity: setup.desk === "standing" ? 0 : 1, transition: `opacity ${ease}` }}>
              <rect x="-118" y="300" width="16" height="170" rx="6" fill="oklch(0.2 0.008 62)" />
              <rect x="-104" y="452" width="86" height="14" rx="6" fill="oklch(0.2 0.008 62)" />
            </g>
            {/* torso + head */}
            <path d={`M-30 ${470 - lift} C -34 400, -22 340, 10 316 L 46 316 C 62 352, 60 420, 52 ${470 - lift} Z`} />
            <circle cx="34" cy="274" r="30" />
            <path d="M46 322 C 78 330, 108 372, 126 430 L 106 442 C 88 396, 66 364, 42 352 Z" />
          </g>
          {/* eye level marker */}
          <circle cx="52" cy="270" r="3.5" fill={distTone} style={{ transition: `fill ${ease}` }} />
        </g>


        {/* measurement between eye and screen */}
        <g style={{ opacity: sub("distance"), transition: `all ${ease}` }}>
          <line
            x1={personX + 60}
            y1={eyeY - 4}
            x2={screenX - 4}
            y2={eyeY - 4}
            stroke={distTone}
            strokeWidth="1.5"
            strokeDasharray="2 7"
            strokeLinecap="round"
            style={{ transition: `all ${ease}` }}
          />
          <text
            x={(personX + 60 + screenX) / 2}
            y={eyeY - 20}
            textAnchor="middle"
            fill={distTone}
            style={{ fontFamily: "var(--font-mono)", fontSize: 19, letterSpacing: "-0.03em", transition: `all ${ease}` }}
          >
            {Math.round(distance)} cm
          </text>
        </g>

        {/* atmosphere: thermal cast */}
        <rect
          x="0"
          y="0"
          width="1200"
          height="620"
          fill={cast}
          style={{ opacity: Math.abs(warm) * 0.3, mixBlendMode: "soft-light", transition: `all ${ease}` }}
        />
        {/* atmosphere: humidity haze */}
        <rect
          x="0"
          y="0"
          width="1200"
          height="620"
          fill="oklch(0.85 0.01 220)"
          style={{ opacity: haze * 0.2, transition: `opacity ${ease}` }}
        />
        {/* atmosphere: dryness — thin, hard air */}
        <rect
          x="0"
          y="0"
          width="1200"
          height="620"
          fill="oklch(0.9 0.05 60)"
          style={{ opacity: dry * 0.07, mixBlendMode: "overlay", transition: `opacity ${ease}` }}
        />
        {/* glare */}
        <ellipse
          cx="220"
          cy="200"
          rx="520"
          ry="360"
          fill="oklch(0.98 0.05 84)"
          style={{ opacity: glare * 0.3, transition: `opacity ${ease}` }}
        />
        {/* darkness veil */}
        <rect
          x="0"
          y="0"
          width="1200"
          height="620"
          fill="var(--deep)"
          style={{ opacity: Math.max(0, 0.86 - exposure * 0.88), transition: `opacity ${ease}` }}
        />
        {overlay}
        </g>
      </svg>

      {/* corner readouts, instrument-panel style */}
      {showReadouts && (
      <div className="pointer-events-none flex flex-wrap items-center gap-x-8 gap-y-2 px-5 pb-5 pt-4 md:absolute md:inset-x-0 md:bottom-0 md:px-8 md:pt-16">

        {(["light", "temperature", "humidity"] as const).map((k) => (
          <div key={k} className="flex items-baseline gap-2">
            <span className="label-eyebrow">{metrics[k].label}</span>
            <span className="mono-num text-sm text-foreground/90">
              {k === "temperature" ? reading[k].toFixed(1) : Math.round(reading[k])}
              {metrics[k].unit === "%" ? "%" : ` ${metrics[k].unit}`}
            </span>
            <span className="text-[11px] text-muted-foreground">{zoneOf(k, reading[k])}</span>
          </div>
        ))}
      </div>
      )}

    </div>
  );
}
