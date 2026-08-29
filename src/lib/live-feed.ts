/**
 * Live sensor feed.
 *
 * Real hardware (NodeMCU) writes rows into the `nodemcu` table:
 *   { id, created_at, distance (cm), light_state: "bright" | "dark" }
 *
 * This module maps that row onto the app's `SensorReading` contract so the
 * scoring engine, scene and guidance stay completely unchanged.
 */

import { createClient } from "@supabase/supabase-js";

import { defaultReading, type SensorReading } from "./whi";

const SUPABASE_URL = "https://hvqsirkviujjhoufvtuz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2DwBLlVZBoMhtX0IGAfWSg_waH1K96X";

export const supabaseLive = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type NodemcuRow = {
  id: number;
  created_at: string;
  distance: number | null;
  light_state: string | null;
};

/**
 * Channels the physical module reports at the desk. Temperature, humidity and
 * air quality come from a local weather API instead (area, not workspace).
 */
export const liveChannels = {
  distance: true,
  light: true,
  temperature: false,
  humidity: false,
  aqi: false,
};

/** Approximate lux for the LDR's two-state output. */
export function luxFromState(state: string | null): number {
  return state === "bright" ? 520 : 60;
}

export function readingFromRow(row: NodemcuRow, fallback: SensorReading = defaultReading): SensorReading {
  return {
    distance: typeof row.distance === "number" ? row.distance : fallback.distance,
    light: luxFromState(row.light_state),
    // Not measured at the desk — supplied by the local weather API layer.
    temperature: fallback.temperature,
    humidity: fallback.humidity,
    aqi: fallback.aqi,
  };
}

export async function fetchLatestRow(): Promise<NodemcuRow | null> {
  const { data, error } = await supabaseLive
    .from("nodemcu")
    .select("id, created_at, distance, light_state")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as NodemcuRow | null) ?? null;
}
