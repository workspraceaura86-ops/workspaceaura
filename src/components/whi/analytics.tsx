import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { metricList, statusOf, subScore, type SensorReading } from "@/lib/whi";

export type HistoryPoint = { t: number; score: number } & SensorReading;

export function Analytics({
  history,
  reading,
  breaks,
  startedAt,
}: {
  history: HistoryPoint[];
  reading: SensorReading;
  breaks: number;
  startedAt: number;
}) {
  const avg = history.length
    ? Math.round(history.reduce((a, p) => a + p.score, 0) / history.length)
    : 0;
  const min = history.length ? Math.min(...history.map((p) => p.score)) : 0;
  const max = history.length ? Math.max(...history.map((p) => p.score)) : 0;
  const mins = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

  const issues = metricList
    .map((m) => ({ m, s: subScore(m.key, reading[m.key]) }))
    .filter((x) => x.s < 82)
    .sort((a, b) => a.s - b.s)
    .slice(0, 3);

  const data = history.slice(-60).map((p, i) => ({ ...p, i }));

  return (
    <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="surface rounded-[20px] p-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="label-eyebrow">Session telemetry</span>
            <h2 className="mt-1 text-xl font-semibold">Health score history</h2>
          </div>
          <div className="flex gap-5 text-right">
            {[
              { l: "Average", v: avg },
              { l: "Peak", v: max },
              { l: "Low", v: min },
            ].map((s) => (
              <div key={s.l}>
                <p className="label-eyebrow">{s.l}</p>
                <p className="mono-num text-2xl font-semibold text-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--glass-line)",
                  borderRadius: 14,
                  fontSize: 12,
                }}
                labelFormatter={() => "Reading"}
                formatter={(v: number, n: string) => [Math.round(v), n]}
              />
              <Area type="monotone" dataKey="score" stroke="var(--signal)" strokeWidth={2.5} fill="url(#scoreFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border/50 pt-4">
          {metricList.map((m) => {
            const s = subScore(m.key, reading[m.key]);
            return (
              <div key={m.key}>
                <p className="label-eyebrow">{m.label}</p>
                <p className="mono-num text-lg" style={{ color: s > 80 ? "var(--state-excellent)" : s > 55 ? "var(--state-warn)" : "var(--state-poor)" }}>
                  {s}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="surface rounded-[20px] p-6">
        <span className="label-eyebrow">Session summary</span>
        <h2 className="mt-1 text-xl font-semibold">Your {mins}-minute session</h2>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="mono-num text-5xl font-semibold text-foreground">{avg}</span>
          <span className="text-sm text-muted-foreground">average · {statusOf(avg)}</span>
        </div>

        <div className="mt-6">
          <p className="label-eyebrow">Main issues</p>
          <ul className="mt-3 space-y-2">
            {issues.length === 0 && (
              <li className="text-sm text-muted-foreground">No sustained issues detected — clean session.</li>
            )}
            {issues.map(({ m, s }) => (
              <li key={m.key} className="flex items-center gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s < 55 ? "var(--state-poor)" : "var(--state-warn)" }} />
                <span className="text-foreground/90">{m.label}</span>
                <span className="mono-num ml-auto text-xs text-muted-foreground">{s}/100</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="label-eyebrow">Eye breaks</p>
            <p className="mono-num mt-1 text-2xl">{breaks}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="label-eyebrow">Readings</p>
            <p className="mono-num mt-1 text-2xl">{history.length}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
