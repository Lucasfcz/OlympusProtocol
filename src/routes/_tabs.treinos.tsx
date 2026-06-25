import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, ChevronRight, Play } from "lucide-react";

export const Route = createFileRoute("/_tabs/treinos")({
  head: () => ({
    meta: [
      { title: "Treinos — Olympus Protocol" },
      { name: "description", content: "Sua programação semanal de treinos." },
    ],
  }),
  component: Treinos,
});

const week = [
  { day: "SEG", name: "Peito e Tríceps", focus: "Empurrar", duration: "1h 20m", today: false, done: true },
  { day: "TER", name: "Costas e Bíceps", focus: "Puxar", duration: "1h 15m", today: true, done: false },
  { day: "QUA", name: "Pernas — Quadríceps", focus: "Força", duration: "1h 30m", today: false, done: false },
  { day: "QUI", name: "Ombros e Trapézio", focus: "Empurrar", duration: "1h 10m", today: false, done: false },
  { day: "SEX", name: "Pernas — Posterior", focus: "Força", duration: "1h 25m", today: false, done: false },
  { day: "SÁB", name: "Braços Olímpicos", focus: "Volume", duration: "55m", today: false, done: false },
];

function Treinos() {
  return (
    <div className="min-h-screen bg-obsidian text-snow anim-fade px-5 pt-6">
      <header className="flex items-center justify-between">
        <p className="label-caps text-muted-dark">SEMANA 24</p>
        <p className="label-caps-lg text-[12px]">TREINOS</p>
        <span className="w-12" />
      </header>

      <h1 className="text-2xl font-bold mt-5 tracking-tight">Sua Programação</h1>
      <p className="text-xs text-muted-dark mt-1">6 treinos planejados &middot; foco em força</p>

      <ul className="mt-6 space-y-3">
        {week.map((w) => (
          <li key={w.day} className={`card-dark p-4 flex items-center gap-4 btn-press ${w.today ? "border-gold/60" : ""}`}>
            <div className="w-12 text-center">
              <div className={`text-[10px] tracking-widest ${w.today ? "text-gold" : "text-muted-dark"}`}>{w.day}</div>
              <div className="mt-1 w-9 h-9 rounded-full border border-gold/20 flex items-center justify-center mx-auto">
                <Dumbbell size={14} className={w.done ? "text-gold/40" : "text-gold"} strokeWidth={1.6} />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[15px]">{w.name}</div>
              <div className="text-[11px] text-muted-dark mt-0.5">{w.focus} &middot; {w.duration}</div>
            </div>
            {w.today ? (
              <Link to="/treino" className="rounded-full bg-gold text-obsidian px-3 py-2 label-caps text-[10px] flex items-center gap-1">
                <Play size={10} fill="currentColor" /> Iniciar
              </Link>
            ) : (
              <ChevronRight size={18} className="text-muted-dark" />
            )}
          </li>
        ))}
      </ul>

      <Link to="/conquistas" className="mt-6 mb-2 block text-center label-caps text-gold">
        VER CONQUISTAS →
      </Link>
    </div>
  );
}
