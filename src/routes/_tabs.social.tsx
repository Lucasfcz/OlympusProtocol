import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Award } from "lucide-react";
import { ranking } from "@/lib/mock-data";

export const Route = createFileRoute("/_tabs/social")({
  head: () => ({
    meta: [
      { title: "Social — Olympus Protocol" },
      { name: "description", content: "Ranking, amigos e desafios da comunidade Olympus." },
    ],
  }),
  component: Social,
});

const tabs = ["RANKING", "AMIGOS", "DESAFIOS"] as const;

function Social() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("RANKING");
  return (
    <div className="min-h-screen bg-obsidian text-snow anim-fade px-5 pt-6">
      <header className="flex items-center justify-center relative">
        <p className="label-caps-lg text-[12px]">SOCIAL</p>
      </header>

      <div className="mt-5 flex border-b border-gold/15">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pb-3 label-caps text-[11px] relative ${tab === t ? "text-snow" : "text-muted-dark"}`}
          >
            {t}
            {tab === t && <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button className="flex items-center gap-1.5 text-xs text-muted-dark border border-gold/20 rounded-full px-3 py-1.5">
          Semana <ChevronDown size={14} />
        </button>
      </div>

      <ul className="mt-4 space-y-2.5">
        {ranking.map((r) => (
          <li
            key={r.pos}
            className={`card-dark px-3 py-3 flex items-center gap-3 ${r.you ? "border-gold/60 shadow-gold" : ""}`}
          >
            <span className={`w-6 text-center font-bold ${posColor(r.pos)}`}>{r.pos}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-charcoal to-obsidian border border-gold/20 flex items-center justify-center text-[11px] text-gold">
              {initials(r.name)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{r.name}</div>
              <div className="text-[11px] text-muted-dark">{r.workouts} treinos</div>
            </div>
            <Award size={18} className={medalColor(r.pos)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function posColor(p: number) {
  if (p === 1) return "text-gold";
  if (p === 2) return "text-silver";
  if (p === 3) return "text-bronze";
  return "text-muted-dark";
}
function medalColor(p: number) {
  if (p === 1) return "text-gold";
  if (p === 2) return "text-silver";
  if (p === 3) return "text-bronze";
  return "text-muted-dark/40";
}
function initials(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}
