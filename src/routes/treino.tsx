import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Timer, Check } from "lucide-react";
import { useState } from "react";
import { exercisesToday } from "@/lib/mock-data";
import { MuscleIcon } from "@/components/olympus/Icons";
import { BottomNav } from "@/components/olympus/BottomNav";

export const Route = createFileRoute("/treino")({
  head: () => ({
    meta: [
      { title: "Treino — Peito e Tríceps" },
      { name: "description", content: "Sessão de treino guiada com checklist de exercícios." },
    ],
  }),
  component: WorkoutSession,
});

function WorkoutSession() {
  const navigate = useNavigate();
  const [list, setList] = useState(exercisesToday);
  const done = list.filter((e) => e.done).length;
  const pct = (done / list.length) * 100;

  return (
    <div className="min-h-screen bg-ivory text-ink anim-slide pb-32">
      <header className="flex items-center justify-between px-5 pt-6">
        <Link to="/home" className="btn-press"><ArrowLeft size={22} strokeWidth={1.6} /></Link>
        <p className="label-caps-lg text-[12px]">TREINO</p>
        <button className="btn-press"><Timer size={20} strokeWidth={1.6} /></button>
      </header>

      <section className="px-5 mt-6">
        <h1 className="text-2xl font-bold tracking-tight">Peito e Tríceps</h1>
        <p className="text-xs text-muted-light mt-1">{done}/{list.length} exercícios</p>
        <div className="mt-3 h-1.5 bg-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full anim-bar"
            style={{ width: `${pct}%`, ["--bar-scale" as string]: "1" }}
          />
        </div>
      </section>

      <ul className="px-5 mt-6 space-y-3">
        {list.map((ex, i) => (
          <li
            key={ex.id}
            className="card-light p-4 flex items-center gap-3 btn-press"
            onClick={() => {
              if (!ex.done) navigate({ to: "/serie", search: { ex: ex.id } });
            }}
          >
            <div className="w-10 h-10 rounded-full bg-ivory-2 flex items-center justify-center text-ink/70">
              <MuscleIcon kind={ex.muscle} className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[15px]">{ex.name}</div>
              <div className="text-xs text-muted-light">{ex.sets} séries</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setList((l) => l.map((x, idx) => (idx === i ? { ...x, done: !x.done } : x)));
              }}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                ex.done ? "bg-gold border-gold" : "border-ink/30"
              }`}
              aria-label={ex.done ? "Desfazer" : "Concluir"}
            >
              {ex.done && <Check size={16} className="text-obsidian anim-check" strokeWidth={2.5} />}
            </button>
          </li>
        ))}
      </ul>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-24 pt-4 bg-gradient-to-t from-ivory via-ivory to-transparent">
        <button className="w-full rounded-full bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold">
          FINALIZAR TREINO
        </button>
      </div>

      <BottomNav theme="light" />
    </div>
  );
}
