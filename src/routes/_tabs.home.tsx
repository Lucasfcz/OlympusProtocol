import { createFileRoute, Link } from "@tanstack/react-router";
import { Menu, Bell, Play, Dumbbell, Scale, Clock } from "lucide-react";
import { RingProgress } from "@/components/olympus/RingProgress";

export const Route = createFileRoute("/_tabs/home")({
  head: () => ({
    meta: [
      { title: "Início — Olympus Protocol" },
      { name: "description", content: "Painel diário do atleta: disciplina, próximo treino e resumo semanal." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-obsidian text-snow px-5 pt-6 anim-fade">
      <header className="flex items-center justify-between">
        <button className="text-snow btn-press"><Menu size={22} strokeWidth={1.6} /></button>
        <button className="text-snow btn-press relative">
          <Bell size={20} strokeWidth={1.6} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>
      </header>

      <div className="mt-7">
        <p className="label-caps text-muted-dark">BOM DIA,</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">ATLETA</h1>
      </div>

      {/* Discipline card */}
      <section className="card-dark mt-6 p-5">
        <p className="label-caps text-muted-dark">DISCIPLINA</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="text-5xl font-bold text-snow tracking-tight">92<span className="text-gold">%</span></div>
            <p className="text-[12px] text-muted-dark mt-3 leading-snug max-w-[180px]">
              Você concluiu 44 dos últimos 48 treinos planejados.
            </p>
          </div>
          <RingProgress value={92} size={96} stroke={6} />
        </div>
      </section>

      {/* Next workout */}
      <section className="card-dark mt-4 p-5">
        <p className="label-caps text-muted-dark">PRÓXIMO TREINO</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-xl font-semibold mt-1">Costas e Bíceps</h2>
            <p className="text-xs text-muted-dark mt-1">Hoje &middot; 18:00</p>
          </div>
          <span className="text-gold/60">›</span>
        </div>
        <Link
          to="/treino"
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gold text-obsidian py-3.5 label-caps-lg text-[12px] btn-press shadow-gold"
        >
          <Play size={14} fill="currentColor" /> INICIAR TREINO
        </Link>
      </section>

      {/* Weekly summary */}
      <section className="card-dark mt-4 p-5">
        <p className="label-caps text-muted-dark">RESUMO SEMANAL</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBlock icon={<Dumbbell size={16} className="text-gold" strokeWidth={1.6} />} value="4" label="Treinos" />
          <div className="border-l border-gold/20" />
          <StatBlock icon={<Scale size={16} className="text-gold" strokeWidth={1.6} />} value="12.540 kg" label="Volume" big />
        </div>
        <div className="mt-3 flex justify-end">
          <StatBlock icon={<Clock size={16} className="text-gold" strokeWidth={1.6} />} value="6h 35m" label="Duração" />
        </div>
      </section>
    </div>
  );
}

function StatBlock({ icon, value, label, big = false }: { icon: React.ReactNode; value: string; label: string; big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className={`font-semibold text-snow ${big ? "text-[15px]" : "text-base"}`}>{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-dark">{label}</div>
      </div>
    </div>
  );
}
