import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { setHistory } from "@/lib/mock-data";

export const Route = createFileRoute("/serie")({
  validateSearch: (s: Record<string, unknown>) => ({ ex: (s.ex as string) || "supino-reto" }),
  head: () => ({
    meta: [
      { title: "Série — Olympus Protocol" },
      { name: "description", content: "Registre carga, repetições e RPE da série." },
    ],
  }),
  component: SetLog,
});

function SetLog() {
  const [kg, setKg] = useState(85);
  const [reps, setReps] = useState(8);
  const [rpe, setRpe] = useState(8);

  return (
    <div className="min-h-screen bg-obsidian text-snow anim-slide pb-10">
      <header className="flex items-center justify-between px-5 pt-6">
        <Link to="/treino" className="btn-press"><ArrowLeft size={22} strokeWidth={1.6} /></Link>
        <p className="label-caps-lg text-[12px] text-snow">SÉRIE</p>
        <span className="w-6" />
      </header>

      <section className="px-5 mt-6">
        <h1 className="text-xl font-semibold">Supino Reto</h1>
        <p className="text-xs text-muted-dark mt-1">4ª série de 4</p>
      </section>

      <section className="px-5 mt-7 grid grid-cols-2 gap-3">
        <Stepper label="CARGA" value={kg} unit="kg" step={2.5} onChange={setKg} />
        <Stepper label="REPETIÇÕES" value={reps} unit="reps" step={1} onChange={setReps} />
      </section>

      <section className="px-5 mt-7">
        <p className="label-caps text-muted-dark">RPE (opcional)</p>
        <div className="mt-2 flex items-end gap-3">
          <div className="text-5xl font-bold text-snow leading-none">{rpe}</div>
          <p className="text-xs text-muted-dark pb-2">Percepção de esforço</p>
        </div>
        <div className="mt-4 flex gap-1 h-3">
          {Array.from({ length: 10 }).map((_, i) => {
            const active = i < rpe;
            return (
              <button
                key={i}
                onClick={() => setRpe(i + 1)}
                className={`flex-1 rounded-sm anim-seg origin-bottom ${
                  active ? "bg-gold" : "bg-charcoal border border-gold/20"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
                aria-label={`RPE ${i + 1}`}
              />
            );
          })}
        </div>
      </section>

      <div className="px-5 mt-8">
        <button className="w-full rounded-full bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold">
          SALVAR SÉRIE
        </button>
      </div>

      <section className="px-5 mt-8">
        <div className="card-dark p-5">
          <p className="label-caps text-muted-dark">HISTÓRICO</p>
          <ul className="mt-3 divide-y divide-gold/15">
            {setHistory.map((s) => (
              <li key={s.n} className="grid grid-cols-3 py-3 text-sm">
                <span className="text-muted-dark">{s.n}ª série</span>
                <span className="text-snow">{s.reps} reps</span>
                <span className="text-snow text-right">{s.kg} kg</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stepper({
  label, value, unit, step, onChange,
}: { label: string; value: number; unit: string; step: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="label-caps text-muted-dark">{label}</p>
      <div className="mt-2 card-dark p-3 flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="w-9 h-9 rounded-full bg-gold-dim/30 border border-gold/30 text-gold flex items-center justify-center btn-press"
          aria-label="Diminuir"
        >
          <Minus size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-snow">{value}</span>
          <span className="text-xs text-muted-dark ml-1">{unit}</span>
        </div>
        <button
          onClick={() => onChange(value + step)}
          className="w-9 h-9 rounded-full bg-gold-dim/30 border border-gold/30 text-gold flex items-center justify-center btn-press"
          aria-label="Aumentar"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
