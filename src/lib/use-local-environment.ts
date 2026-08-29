import { useEffect, useState } from "react";

import { fetchLocalEnvironment, getCoords, type LocalEnvironment } from "./local-environment";

export type LocalEnvState = {
  status: "idle" | "locating" | "loading" | "ready" | "error";
  data: LocalEnvironment | null;
  error: string | null;
  lastUpdate: number | null;
};

const initial: LocalEnvState = { status: "idle", data: null, error: null, lastUpdate: null };

/** Polls Open-Meteo for the user's *area* conditions while enabled (10 min cadence). */
export function useLocalEnvironment(enabled: boolean): LocalEnvState {
  const [state, setState] = useState<LocalEnvState>(initial);

  useEffect(() => {
    if (!enabled) {
      setState(initial);
      return;
    }
    let alive = true;
    let id: ReturnType<typeof setInterval> | null = null;

    (async () => {
      setState((s) => ({ ...s, status: "locating" }));
      try {
        const coords = await getCoords();
        if (!alive) return;
        setState((s) => ({ ...s, status: "loading" }));

        const tick = async () => {
          try {
            const data = await fetchLocalEnvironment(coords.latitude, coords.longitude);
            if (!alive) return;
            setState({ status: "ready", data, error: null, lastUpdate: Date.now() });
          } catch (e) {
            if (!alive) return;
            setState((s) => ({
              ...s,
              status: s.data ? "ready" : "error",
              error: e instanceof Error ? e.message : "Could not load local conditions.",
            }));
          }
        };
        await tick();
        id = setInterval(tick, 10 * 60_000);
      } catch (e) {
        if (!alive) return;
        setState({
          status: "error",
          data: null,
          error: e instanceof Error ? e.message : "Location unavailable.",
          lastUpdate: null,
        });
      }
    })();

    return () => {
      alive = false;
      if (id) clearInterval(id);
    };
  }, [enabled]);

  return state;
}
