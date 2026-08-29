import { useEffect, useRef, useState } from "react";

import { fetchLatestRow, readingFromRow, type NodemcuRow } from "./live-feed";
import { defaultReading, type SensorReading } from "./whi";

export type LiveState = {
  status: "idle" | "connecting" | "live" | "error";
  reading: SensorReading | null;
  row: NodemcuRow | null;
  error: string | null;
  lastUpdate: number | null;
};

const initial: LiveState = {
  status: "idle",
  reading: null,
  row: null,
  error: null,
  lastUpdate: null,
};

/** Polls the hardware table while `enabled`. Stops entirely in simulation mode. */
export function useLiveFeed(enabled: boolean, baseline: SensorReading = defaultReading): LiveState {
  const [state, setState] = useState<LiveState>(initial);
  const baseRef = useRef(baseline);
  baseRef.current = baseline;

  useEffect(() => {
    if (!enabled) {
      setState(initial);
      return;
    }

    let alive = true;
    setState((s) => ({ ...s, status: "connecting" }));

    const tick = async () => {
      try {
        const row = await fetchLatestRow();
        if (!alive) return;
        if (!row) {
          setState((s) => ({ ...s, status: "error", error: "No sensor rows yet." }));
          return;
        }
        setState({
          status: "live",
          reading: readingFromRow(row, baseRef.current),
          row,
          error: null,
          lastUpdate: Date.now(),
        });
      } catch (e) {
        if (!alive) return;
        setState((s) => ({
          ...s,
          status: "error",
          error: e instanceof Error ? e.message : "Could not reach the sensor feed.",
        }));
      }
    };

    void tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled]);

  return state;
}
