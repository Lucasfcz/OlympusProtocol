import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { badges } from "@/lib/mock-data";
import { ColumnSmall, Laurel } from "@/components/olympus/Icons";

export const Route = createFileRoute("/conquistas")({
  head: () => ({
    meta: [
      { title: "Conquistas — Olympus Protocol" },
      { name: "description", content: "Badges hexagonais conquistados na jornada Olympus." },
    ],
  }),
  component: Conquistas,
});

const tabs = ["TODAS", "CONQUISTAS"] as const;

function Conquistas() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("TODAS");
  const list = tab === "CONQUISTAS" ? badges.filter((b) => b.unlocked) : badges;

  return (
    <div className="min-h-screen bg-ivory text-ink anim-fade px-5 pt-6 pb-10">
      <header className="grid grid-cols-3 items-center">
        <Link to="/perfil" className="btn-press justify-self-start"><ArrowLeft size={20} strokeWidth={1.6} /></Link>
        <div className="flex items-center justify-center gap-2">
          <ColumnSmall className="text-ink" size={20} />
          <p className="label-caps-lg text-[12px]">CONQUISTAS</p>
        </div>
        <span />
      </header>

      <div className="mt-6 flex border-b border-ink/10">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pb-3 label-caps text-[11px] relative ${tab === t ? "text-ink" : "text-muted-light"}`}
          >
            {t}
            {tab === t && <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6">
        {list.map((b) => (
          <li key={b.id} className="flex flex-col items-center text-center">
            <Hex unlocked={b.unlocked} icon={b.icon} />
            <div className={`mt-2 text-[12px] font-semibold ${b.unlocked ? "text-ink" : "text-ink/50"}`}>{b.title}</div>
            <div className="text-[10px] leading-tight text-muted-light mt-0.5 px-1">{b.subtitle}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hex({ unlocked, icon }: { unlocked: boolean; icon: string }) {
  const gold = unlocked ? "#C9A24B" : "rgba(201,162,75,0.35)";
  return (
    <div className={`relative w-[88px] h-[100px] ${unlocked ? "anim-badge" : ""}`}>
      <svg viewBox="0 0 88 100" className="absolute inset-0">
        <defs>
          <linearGradient id={`gx-${unlocked}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E1E1E" />
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>
        </defs>
        <polygon
          points="44,2 84,25 84,75 44,98 4,75 4,25"
          fill={`url(#gx-${unlocked})`}
          stroke={gold}
          strokeWidth="2"
        />
        {unlocked && (
          <polygon
            points="44,2 84,25 84,75 44,98 4,75 4,25"
            fill="none"
            stroke={gold}
            strokeWidth="6"
            opacity="0.15"
          />
        )}
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center`} style={{ color: gold }}>
        {icon === "wreath" && <Laurel size={36} />}
        {icon === "column" && <ColumnSmall size={32} />}
        {icon === "athlete" && <AthleteGlyph />}
        {icon === "lift" && <LiftGlyph />}
      </div>
    </div>
  );
}

function AthleteGlyph() {
  return (
    <svg viewBox="0 0 32 32" width={34} height={34} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="16" cy="6" r="3" />
      <path d="M16 10 L 16 20 M 10 14 L 22 14 M 12 28 L 16 20 L 20 28" strokeLinecap="round" />
    </svg>
  );
}
function LiftGlyph() {
  return (
    <svg viewBox="0 0 32 32" width={34} height={34} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="16" cy="6" r="2.5" />
      <path d="M16 9 L 16 17 M 10 13 L 22 13" strokeLinecap="round" />
      <rect x="3" y="20" width="4" height="6" />
      <rect x="25" y="20" width="4" height="6" />
      <line x1="7" y1="23" x2="25" y2="23" strokeWidth="2" />
    </svg>
  );
}
