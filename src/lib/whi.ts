/**
 * Workspace Health Intelligence — sensor model + scoring engine.
 *
 * SENSOR SOURCE ABSTRACTION
 * -------------------------
 * Today the readings come from `SimulatedSensorSource` (the on-screen sliders).
 * Later, a real pipeline (Sensors -> NodeMCU -> Firebase -> Website) can supply
 * the exact same `SensorReading` shape via another `SensorSource` implementation
 * and nothing below has to change.
 */

export type SensorReading = {
  /** Eye-to-screen distance in cm */
  distance: number;
  /** Ambient light in lux */
  light: number;
  /** Ambient temperature in °C */
  temperature: number;
  /** Relative humidity in % */
  humidity: number;
  /** US Air Quality Index for the user's local area */
  aqi: number;
};

export type SensorSource = {
  id: string;
  read: () => SensorReading;
};

export const defaultReading: SensorReading = {
  distance: 62,
  light: 380,
  temperature: 22.5,
  humidity: 45,
  aqi: 38,
};

export type MetricKey = keyof SensorReading;

export type MetricMeta = {
  key: MetricKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  weight: number;
  /** Ideal band */
  ideal: [number, number];
  zones: { upTo: number; label: string }[];
};

export const metrics: Record<MetricKey, MetricMeta> = {
  distance: {
    key: "distance",
    label: "Screen Distance",
    unit: "cm",
    min: 20,
    max: 100,
    step: 1,
    weight: 0.7,
    ideal: [55, 75],
    zones: [
      { upTo: 40, label: "Too close" },
      { upTo: 52, label: "Slightly close" },
      { upTo: 78, label: "Optimal" },
      { upTo: 90, label: "Slightly far" },
      { upTo: Infinity, label: "Too far" },
    ],
  },
  light: {
    key: "light",
    label: "Ambient Lighting",
    unit: "lux",
    min: 0,
    max: 1000,
    step: 5,
    weight: 0,
    ideal: [300, 600],
    zones: [
      { upTo: 80, label: "Dark" },
      { upTo: 250, label: "Dim" },
      { upTo: 650, label: "Normal" },
      { upTo: 850, label: "Bright" },
      { upTo: Infinity, label: "Glare risk" },
    ],
  },
  temperature: {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    min: 12,
    max: 34,
    step: 0.5,
    weight: 0.1,
    ideal: [20.5, 24.5],
    zones: [
      { upTo: 17, label: "Cold" },
      { upTo: 20.4, label: "Cool" },
      { upTo: 24.6, label: "Comfortable" },
      { upTo: 28, label: "Warm" },
      { upTo: Infinity, label: "Hot" },
    ],
  },
  humidity: {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    min: 10,
    max: 90,
    step: 1,
    weight: 0.1,
    ideal: [40, 55],
    zones: [
      { upTo: 25, label: "Very dry" },
      { upTo: 39, label: "Dry" },
      { upTo: 56, label: "Comfortable" },
      { upTo: 70, label: "Humid" },
      { upTo: Infinity, label: "High humidity" },
    ],
  },
  aqi: {
    key: "aqi",
    label: "Air Quality",
    unit: "AQI",
    min: 0,
    max: 200,
    step: 1,
    weight: 0.1,
    ideal: [0, 50],
    zones: [
      { upTo: 50, label: "Good" },
      { upTo: 100, label: "Moderate" },
      { upTo: 150, label: "Unhealthy for sensitive groups" },
      { upTo: 200, label: "Unhealthy" },
      { upTo: Infinity, label: "Very unhealthy" },
    ],
  },
};

/**
 * Where each channel's number actually comes from.
 *
 * Distance is the only precise, workspace-specific measurement, so it carries
 * 70% of the Aura Score. Temperature, humidity and air quality are *general
 * local conditions* for the user's area, pulled from a free weather API — not
 * measurements of the desk itself — so each is weighted only 10%. The light
 * sensor reports two states (bright / dark) with no graded value, so it is
 * shown for information but excluded from the score entirely.
 */
export const sourceOf: Record<MetricKey, { origin: "sensor" | "local"; text: string; scored: boolean }> = {
  distance: {
    origin: "sensor",
    text: "Measured at your desk by the NodeMCU ultrasonic sensor — the primary factor (70%).",
    scored: true,
  },
  light: {
    origin: "sensor",
    text: "Bright / dark only from the LDR — informational, not scored (no graded value to score).",
    scored: false,
  },
  temperature: {
    origin: "local",
    text: "General outdoor conditions for your area (Open-Meteo), not your workspace — weighted 10%.",
    scored: true,
  },
  humidity: {
    origin: "local",
    text: "General outdoor conditions for your area (Open-Meteo), not your workspace — weighted 10%.",
    scored: true,
  },
  aqi: {
    origin: "local",
    text: "Local US AQI for your area (Open-Meteo air quality), not your workspace — weighted 10%.",
    scored: true,
  },
};

export const metricList = [
  metrics.distance,
  metrics.light,
  metrics.temperature,
  metrics.humidity,
  metrics.aqi,
];

/** Channels that actually contribute to the Aura Score (light is excluded). */
export const scoredMetricList = metricList.filter((m) => m.weight > 0);

export function zoneOf(key: MetricKey, value: number): string {
  return metrics[key].zones.find((z) => value <= z.upTo)!.label;
}

/** 0-100 sub-score: 100 inside the ideal band, decaying outside it. */
export function subScore(key: MetricKey, value: number): number {
  const m = metrics[key];
  const [lo, hi] = m.ideal;
  if (value >= lo && value <= hi) return 100;
  const span = m.max - m.min;
  const dist = value < lo ? lo - value : value - hi;
  const norm = dist / (span * 0.42);
  return Math.max(0, Math.round(100 * Math.exp(-1.9 * norm * norm) * (1 - 0.12 * norm)));
}

export type Status = "Excellent" | "Good" | "Needs Improvement" | "Poor";

export function statusOf(score: number): Status {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

export function statusTone(status: Status) {
  switch (status) {
    case "Excellent":
      return { token: "excellent", color: "var(--state-excellent)" };
    case "Good":
      return { token: "good", color: "var(--state-good)" };
    case "Needs Improvement":
      return { token: "warn", color: "var(--state-warn)" };
    default:
      return { token: "poor", color: "var(--state-poor)" };
  }
}

export function healthScore(r: SensorReading): number {
  const total = scoredMetricList.reduce((acc, m) => acc + subScore(m.key, r[m.key]) * m.weight, 0);
  return Math.round(total);
}

/* ---------------------------------- Reasoning ---------------------------------- */

export type ReasonLine = {
  key: MetricKey;
  text: string;
  delta: number;
  direction: "up" | "down";
};

export type Reasoning = {
  delta: number;
  lines: ReasonLine[];
  headline: string;
};

const verb: Record<MetricKey, string> = {
  distance: "Screen distance",
  light: "Ambient lighting",
  temperature: "Temperature",
  humidity: "Humidity",
  aqi: "Local air quality",
};

function fmt(key: MetricKey, v: number) {
  const m = metrics[key];
  return `${key === "temperature" ? v.toFixed(1) : Math.round(v)}${m.unit === "%" ? "" : " "}${m.unit}`;
}

export function explain(prev: SensorReading, next: SensorReading): Reasoning {
  const delta = healthScore(next) - healthScore(prev);
  const lines: ReasonLine[] = scoredMetricList
    .map((m) => {
      const d = (subScore(m.key, next[m.key]) - subScore(m.key, prev[m.key])) * m.weight;
      return {
        key: m.key,
        delta: d,
        direction: (d >= 0 ? "up" : "down") as "up" | "down",
        text: `${verb[m.key]} moved from ${fmt(m.key, prev[m.key])} to ${fmt(m.key, next[m.key])} — now ${zoneOf(m.key, next[m.key]).toLowerCase()}`,
      };
    })
    .filter((l) => Math.abs(l.delta) >= 0.6)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const headline =
    lines.length === 0
      ? "Your workspace is holding steady — no meaningful environmental change detected."
      : delta < 0
        ? `Your workspace score dropped ${Math.abs(delta)} point${Math.abs(delta) === 1 ? "" : "s"} because:`
        : `Your workspace score gained ${Math.abs(delta)} point${Math.abs(delta) === 1 ? "" : "s"} because:`;

  return { delta, lines, headline };
}

/* -------------------------------- Recommendations ------------------------------- */

export type Recommendation = {
  id: string;
  key: MetricKey | "break";
  /** true when this line is context only and does not affect the score. */
  informational?: boolean;
  icon: "eye" | "sun" | "thermo" | "droplet" | "timer";
  title: string;
  body: string;
  severity: "critical" | "warning" | "ok";
  impact: number;
  /** Which physical sensor produced the reading behind this line. */
  sensor: string;
};

/** Sensor hardware behind each measured channel — shown for transparency. */
export const sensorOf: Record<MetricKey, { part: string; name: string }> = {
  distance: { part: "HC-SR04", name: "Ultrasonic distance" },
  light: { part: "LDR", name: "Ambient light" },
  temperature: { part: "Open-Meteo", name: "Local temperature (area, not desk)" },
  humidity: { part: "Open-Meteo", name: "Local humidity (area, not desk)" },
  aqi: { part: "Open-Meteo", name: "Local air quality (area, not desk)" },
};

/**
 * Distance wording. WHI measures viewing distance only — never posture.
 * `sustainedMs` is how long the reading has stayed below the healthy band.
 */
export function distanceGuidance(distance: number, sustainedMs = 0) {
  if (distance < 55) {
    if (sustainedMs > 3 * 60_000) {
      return {
        title: "Viewing distance has stayed close for a while",
        body: `Your viewing distance has remained below the recommended range for several minutes (currently ${Math.round(distance)} cm). This may increase visual discomfort and neck strain over time. Recommended ergonomic viewing distance is 55–75 cm.`,
      };
    }
    return {
      title: "You appear to be moving closer to the screen",
      body: `Measured viewing distance is ${Math.round(distance)} cm. Consider moving your chair back slightly, or pushing the monitor away, to maintain a comfortable viewing distance of 55–75 cm.`,
    };
  }
  if (distance > 78) {
    return {
      title: "You are sitting farther than recommended",
      body: `Measured viewing distance is ${Math.round(distance)} cm. Consider moving slightly closer for comfortable viewing — the recommended ergonomic range is 55–75 cm.`,
    };
  }
  return {
    title: "Viewing distance is within the recommended ergonomic range",
    body: `Measured at ${Math.round(distance)} cm. Keep the top of the screen at or just below eye level and your seating position relaxed.`,
  };
}

export function recommend(r: SensorReading, sustainedCloseMs = 0): Recommendation[] {
  const out: Recommendation[] = [];
  const sev = (s: number): Recommendation["severity"] =>
    s < 55 ? "critical" : s < 82 ? "warning" : "ok";

  const ds = subScore("distance", r.distance);
  const dg = distanceGuidance(r.distance, sustainedCloseMs);
  out.push({
    id: "distance",
    key: "distance",
    icon: "eye",
    title: dg.title,
    body: dg.body,
    severity: sev(ds),
    impact: Math.round((100 - ds) * metrics.distance.weight),
    sensor: `${sensorOf.distance.part} · viewing distance`,
  });


  const ls = subScore("light", r.light);
  out.push({
    id: "light",
    key: "light",
    icon: "sun",
    title:
      r.light < 300
        ? "Increase ambient lighting"
        : r.light > 600
          ? "Reduce glare and harsh light"
          : "Lighting is well balanced",
    body:
      r.light < 300
        ? `Only ${Math.round(r.light)} lux detected. A dark room next to a bright screen forces high pupil contrast — add a desk lamp to reach ~400 lux.`
        : r.light > 600
          ? `${Math.round(r.light)} lux is causing screen glare. Diffuse direct light or angle the monitor away from windows.`
          : "Ambient light matches your screen brightness, minimising eye fatigue.",
    severity: sev(ls),
    impact: Math.round((100 - ls) * metrics.light.weight),
    sensor: "LDR · ambient light",
  });

  const ts = subScore("temperature", r.temperature);
  out.push({
    id: "temperature",
    key: "temperature",
    icon: "thermo",
    title:
      r.temperature < 20.5
        ? "Your desk is running cold"
        : r.temperature > 24.5
          ? "Your desk is running warm"
          : "Thermal comfort is optimal",
    body:
      r.temperature < 20.5
        ? `${r.temperature.toFixed(1)}°C stiffens hands and wrists and slows fine motor accuracy. Target 21–24°C.`
        : r.temperature > 24.5
          ? `${r.temperature.toFixed(1)}°C measurably reduces sustained concentration. Ventilate or lower to 21–24°C.`
          : "Temperature supports sustained focus without drowsiness.",
    severity: sev(ts),
    impact: Math.round((100 - ts) * metrics.temperature.weight),
    sensor: "DHT11 · temperature",
  });

  const hs = subScore("humidity", r.humidity);
  out.push({
    id: "humidity",
    key: "humidity",
    icon: "droplet",
    title:
      r.humidity < 40
        ? "Air is too dry for long sessions"
        : r.humidity > 55
          ? "Humidity is above comfort range"
          : "Humidity is comfortable",
    body:
      r.humidity < 40
        ? `${Math.round(r.humidity)}% RH accelerates tear-film evaporation — a direct cause of dry, gritty eyes. Aim for 40–55%.`
        : r.humidity > 55
          ? `${Math.round(r.humidity)}% RH makes the room feel heavier and warmer than it is. Improve airflow.`
          : "Air moisture is in the range that keeps eyes and airways comfortable.",
    severity: sev(hs),
    impact: Math.round((100 - hs) * metrics.humidity.weight),
    sensor: "DHT11 · humidity",
  });

  return out.sort((a, b) => b.impact - a.impact);
}

export function actionPlan(r: SensorReading): string[] {
  const plan: string[] = [];
  if (r.distance < 55) plan.push("Consider adjusting your seating position back to a 55–75 cm viewing distance");
  if (r.distance > 78) plan.push("Consider moving slightly closer — recommended viewing distance is 55–75 cm");
  if (r.light < 300) plan.push("Turn on a desk lamp to lift ambient light above 300 lux");
  if (r.light > 600) plan.push("Cut direct glare — angle the monitor or draw the blinds");
  if (r.temperature < 20.5) plan.push("Warm the room toward 22°C");
  if (r.temperature > 24.5) plan.push("Ventilate to bring the room back under 24°C");
  if (r.humidity < 40) plan.push("Add moisture to the air and blink deliberately");
  if (r.humidity > 55) plan.push("Increase airflow to shed excess humidity");
  plan.push("Follow the 20-20-20 rule: every 20 min, look 20 ft away for 20 s");
  return plan;
}

export const presets: { id: string; label: string; reading: SensorReading }[] = [
  { id: "optimal", label: "Ideal desk", reading: { distance: 65, light: 450, temperature: 22, humidity: 47 } },
  { id: "night", label: "Late-night coding", reading: { distance: 38, light: 60, temperature: 19, humidity: 32 } },
  { id: "gamer", label: "Gaming rig", reading: { distance: 44, light: 140, temperature: 27, humidity: 38 } },
  { id: "glare", label: "Sunlit café", reading: { distance: 50, light: 900, temperature: 26, humidity: 62 } },
];
