/**
 * Personalization layer.
 *
 * IMPORTANT: there is exactly one WHI intelligence engine (`src/lib/whi.ts`).
 * A profile never replaces scoring — it only re-weights *priority* of the same
 * recommendations, changes wording, and sets session ergonomics (focus length).
 */

import type { MetricKey, Recommendation, SensorReading } from "./whi";

export type ProfileId = "student" | "programmer" | "gamer" | "professional";

export type Profile = {
  id: ProfileId;
  label: string;
  tagline: string;
  /** Plain-language note appended to guidance for this persona. */
  voice: string;
  /** Focus block length for the 20-20-20 companion timer, in minutes. */
  focusMinutes: number;
  /** Priority multipliers — reorder guidance, never change the score model. */
  priority: Record<MetricKey, number>;
  /** Suggested starting environment for this persona. */
  reading: SensorReading;
};

export const profiles: Record<ProfileId, Profile> = {
  student: {
    id: "student",
    label: "Student",
    tagline: "Long reading blocks, shared rooms, variable light.",
    voice: "Study blocks are shorter than work blocks — protect light and posture first.",
    focusMinutes: 25,
    priority: { light: 1.35, distance: 1.15, temperature: 1, humidity: 0.85 },
    reading: { distance: 58, light: 320, temperature: 22, humidity: 44 },
  },
  programmer: {
    id: "programmer",
    label: "Programmer",
    tagline: "Deep multi-hour sessions on dense text.",
    voice: "Dense text at close range is the highest eye-strain load — breaks matter more than comfort.",
    focusMinutes: 45,
    priority: { distance: 1.45, light: 1.25, humidity: 1.05, temperature: 0.85 },
    reading: { distance: 64, light: 380, temperature: 21.5, humidity: 45 },
  },
  gamer: {
    id: "gamer",
    label: "Gamer",
    tagline: "High-refresh screens, dim rooms, warm hardware.",
    voice: "Dim rooms plus bright screens are the classic gaming strain pattern — lift the ambient floor.",
    focusMinutes: 30,
    priority: { light: 1.4, temperature: 1.25, distance: 1.05, humidity: 0.8 },
    reading: { distance: 56, light: 220, temperature: 24, humidity: 42 },
  },
  professional: {
    id: "professional",
    label: "Professional",
    tagline: "Meetings, documents, full working days.",
    voice: "Whole-day comfort wins over peak comfort — air quality and thermal drift do the damage.",
    focusMinutes: 50,
    priority: { temperature: 1.3, humidity: 1.25, distance: 1.1, light: 1 },
    reading: { distance: 68, light: 460, temperature: 22.5, humidity: 48 },
  },
};

export const profileList = [
  profiles.student,
  profiles.programmer,
  profiles.gamer,
  profiles.professional,
];

/* --------------------------------- Workspace ---------------------------------- */

export type MonitorSetup = "single" | "dual" | "ultrawide";
export type DeskSetup = "sitting" | "standing";
export type LightingPreference = "lamp" | "daylight" | "mixed";
export type WorkStyle = "focus" | "balanced" | "sprint";

export type WorkspaceSetup = {
  monitors: MonitorSetup;
  desk: DeskSetup;
  lighting: LightingPreference;
  style: WorkStyle;
};

export const defaultSetup: WorkspaceSetup = {
  monitors: "single",
  desk: "sitting",
  lighting: "mixed",
  style: "balanced",
};

export const styleMinutes: Record<WorkStyle, number> = {
  sprint: 20,
  balanced: 35,
  focus: 50,
};

/** Focus block length in minutes for the current persona + work style. */
export function focusLength(profile: Profile, setup: WorkspaceSetup): number {
  return Math.round((profile.focusMinutes + styleMinutes[setup.style]) / 2);
}

/** Re-rank the engine's recommendations for a persona. Content is unchanged. */
export function personalize(items: Recommendation[], profile: Profile): Recommendation[] {
  return items
    .map((r) => ({
      ...r,
      impact:
        r.key === "break" ? r.impact : Math.round(r.impact * (profile.priority[r.key as MetricKey] ?? 1)),
    }))
    .sort((a, b) => b.impact - a.impact);
}
