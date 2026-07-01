import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { ColumnSmall } from "@/components/olympus/Icons";
import { useTheme } from "@/lib/theme";
import { ExercisesAPI, StatsAPI } from "@/lib/api";

export const Route = createFileRoute("/_tabs/evolucao")({
  head: () => ({
    meta: [
      { title: "Evolução — Olympus Protocol" },
      { name: "description", content: "Progressão por exercício, volume semanal e frequência." },
    ],
  }),
  component: Evolution,
});

const tabs = ["CARGA", "VOLUME", "FREQUÊNCIA"] as const;

function Evolution() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("CARGA");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#8a8378" : "#6b6357";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(26,26,26,0.06)";
  const tooltipBg = theme === "dark" ? "#1E1E1E" : "#1A1A1A";

  const exercises = useQuery({ queryKey: ["exercises"], queryFn: () => ExercisesAPI.list() });

  const currentExId = exerciseId ?? exercises.data?.[0]?.id ?? "";
  const currentExName = exercises.data?.find((e) => e.id === currentExId)?.name ?? "Selecionar exercício";

  const exStats = useQuery({
    queryKey: ["stats", "exercise", currentExId],
    queryFn: () => StatsAPI.exercise(currentExId),
    enabled: !!currentExId && tab === "CARGA",
  });
  const weekly = useQuery({
    queryKey: ["stats", "weekly"], queryFn: StatsAPI.weeklyVolume, enabled: tab === "VOLUME",
  });
  const freq = useQuery({
    queryKey: ["stats", "frequency"], queryFn: StatsAPI.monthlyFrequency, enabled: tab === "FREQUÊNCIA",
  });

  const chartData = useMemo(() => {
    if (tab === "CARGA") {
      return (exStats.data?.progression ?? []).map((p) => ({ m: p.date.slice(5, 10), v: p.value }));
    }
    if (tab === "VOLUME") {
      const map: Record<string, string> = { MONDAY: "SEG", TUESDAY: "TER", WEDNESDAY: "QUA", THURSDAY: "QUI", FRIDAY: "SEX", SATURDAY: "SÁB", SUNDAY: "DOM" };
      return (weekly.data?.volumes ?? []).map((v) => ({ m: map[v.day] || v.day, v: v.volume }));
    }
    return (freq.data?.sessionsPerWeek ?? []).map((s) => ({ m: s.date.slice(5, 10), v: s.value }));
  }, [tab, exStats.data, weekly.data, freq.data]);

  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-5">
      <header className="flex items-center justify-between">
        <ColumnSmall className="text-fg" size={22} />
        <p className="label-caps-lg text-[12px]">EVOLUÇÃO</p>
        <button className="btn-press"><Bell size={20} strokeWidth={1.6} /></button>
      </header>

      <div className="relative mt-6">
        <button onClick={() => setPickerOpen((v) => !v)}
          className="w-full card px-4 py-3.5 flex items-center justify-between btn-press">
          <span className="text-[15px] font-medium truncate pr-2">{currentExName}</span>
          <ChevronDown size={18} className="text-gold" />
        </button>
        {pickerOpen && (
          <ul className="absolute z-20 top-full mt-1 w-full max-h-64 overflow-y-auto olympus-scroll card p-2">
            {exercises.data?.slice(0, 40).map((e) => (
              <li key={e.id}>
                <button onClick={() => { setExerciseId(e.id); setPickerOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-[8px] text-sm hover:bg-gold/10 ${e.id === currentExId ? "text-gold" : ""}`}>
                  {e.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex border-b border-divider">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 pb-3 label-caps text-[11px] relative ${tab === t ? "text-fg" : "text-fg-muted"}`}>
            {t}
            {tab === t && <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <div className="mt-5 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          {tab === "FREQUÊNCIA" ? (
            <BarChart data={chartData} margin={{ top: 24, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(200,164,106,0.08)" }}
                contentStyle={{ background: tooltipBg, border: "none", borderRadius: 8 }}
                labelStyle={{ color: "#C8A46A", fontSize: 10 }}
                itemStyle={{ color: "#fff", fontSize: 12 }} />
              <Bar dataKey="v" fill="#C8A46A" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 24, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={36} />
              <Tooltip cursor={{ stroke: "#C8A46A", strokeDasharray: "3 3" }}
                contentStyle={{ background: tooltipBg, border: "none", borderRadius: 8, padding: "6px 10px" }}
                labelStyle={{ color: "#C8A46A", fontSize: 10, letterSpacing: "0.1em" }}
                itemStyle={{ color: "#fff", fontSize: 12, fontWeight: 600 }}
                formatter={(v) => [`${v} ${tab === "CARGA" ? "kg" : "kg"}`, tab === "CARGA" ? "Carga" : "Volume"]} />
              <Line type="monotone" dataKey="v" stroke="#C8A46A" strokeWidth={2}
                dot={{ r: 2, fill: "#C8A46A", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#C8A46A", stroke: theme === "dark" ? "#0A0A0A" : "#fff", strokeWidth: 2 }}
                animationDuration={800} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {tab === "CARGA" && exStats.data && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="label-caps text-fg-muted">MELHOR MARCA</p>
            <div className="mt-2">
              <span className="text-2xl font-bold">{exStats.data.maxWeight}</span>
              <span className="text-sm text-fg-muted ml-1">kg</span>
            </div>
            <p className="text-[11px] text-fg-muted mt-2">{exStats.data.repsIfMaxWeight} reps</p>
          </div>
          <div className="card p-4 text-center">
            <p className="label-caps text-fg-muted">TOTAL SÉRIES</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gold">{exStats.data.totalSets}</span>
            </div>
            <p className="text-[11px] text-fg-muted mt-2">Registradas</p>
          </div>
        </div>
      )}
      {tab === "FREQUÊNCIA" && freq.data && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="label-caps text-fg-muted">SESSÕES / MÊS</p>
            <div className="mt-2"><span className="text-2xl font-bold">{freq.data.totalSessions}</span></div>
          </div>
          <div className="card p-4 text-center">
            <p className="label-caps text-fg-muted">MÉDIA / SEM</p>
            <div className="mt-2"><span className="text-2xl font-bold text-gold">{freq.data.avgSessionsPerWeek.toFixed(1)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
