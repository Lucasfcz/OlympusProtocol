import { createFileRoute } from "@tanstack/react-router";
import { Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { ColumnSmall } from "@/components/olympus/Icons";
import { weeklyEvolution } from "@/lib/mock-data";

export const Route = createFileRoute("/_tabs/evolucao")({
  head: () => ({
    meta: [
      { title: "Evolução — Olympus Protocol" },
      { name: "description", content: "Acompanhe a evolução de carga, volume e frequência por exercício." },
    ],
  }),
  component: Evolution,
});

const tabs = ["CARGA", "VOLUME", "FREQUÊNCIA"] as const;

function Evolution() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("CARGA");
  return (
    <div className="min-h-screen bg-ivory text-ink anim-fade px-5 pt-6">
      <header className="flex items-center justify-between">
        <ColumnSmall className="text-ink" size={22} />
        <p className="label-caps-lg text-[12px]">EVOLUÇÃO</p>
        <button className="btn-press"><Bell size={20} strokeWidth={1.6} /></button>
      </header>

      <button className="mt-6 w-full card-light px-4 py-3.5 flex items-center justify-between btn-press">
        <span className="text-[15px] font-medium">Supino Reto</span>
        <ChevronDown size={18} className="text-gold" />
      </button>

      <div className="mt-5 flex border-b border-ink/10">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pb-3 label-caps text-[11px] relative ${
              tab === t ? "text-ink" : "text-muted-light"
            }`}
          >
            {t}
            {tab === t && <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <div className="mt-5 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyEvolution} margin={{ top: 24, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="rgba(26,26,26,0.06)" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#6b6357" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fontSize: 10, fill: "#6b6357" }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              cursor={{ stroke: "#C9A24B", strokeDasharray: "3 3" }}
              contentStyle={{ background: "#1A1A1A", border: "none", borderRadius: 8, padding: "6px 10px" }}
              labelStyle={{ color: "#C9A24B", fontSize: 10, letterSpacing: "0.1em" }}
              itemStyle={{ color: "#fff", fontSize: 12, fontWeight: 600 }}
              formatter={(v: number) => [`${v} kg`, "Carga"]}
            />
            <Line type="monotone" dataKey="v" stroke="#C9A24B" strokeWidth={2}
              dot={{ r: 2, fill: "#C9A24B", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#C9A24B", stroke: "#fff", strokeWidth: 2 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="card-light p-4 text-center">
          <p className="label-caps text-muted-light">MELHOR MARCA</p>
          <div className="mt-2"><span className="text-2xl font-bold">85</span><span className="text-sm text-muted-light ml-1">kg</span></div>
          <p className="text-[11px] text-muted-light mt-2">03/06/2024</p>
        </div>
        <div className="card-light p-4 text-center">
          <p className="label-caps text-muted-light">EVOLUÇÃO</p>
          <div className="mt-2"><span className="text-2xl font-bold text-gold">+25</span><span className="text-sm text-muted-light ml-1">kg</span></div>
          <p className="text-[11px] text-muted-light mt-2">Desde 12/01/2024</p>
        </div>
      </div>
    </div>
  );
}
