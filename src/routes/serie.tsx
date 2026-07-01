import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SessionsAPI } from "@/lib/api";

export const Route = createFileRoute("/serie")({
  validateSearch: (s: Record<string, unknown>) => ({
    sid: (s.sid as string) || "",
    seid: (s.seid as string) || "",
  }),
  head: () => ({ meta: [{ title: "Série — Olympus Protocol" }] }),
  component: SetLog,
});

function SetLog() {
  const { sid, seid } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kg, setKg] = useState(0);
  const [reps, setReps] = useState(8);
  const [rpe, setRpe] = useState(8);
  const [rest, setRest] = useState(90);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sid],
    queryFn: () => SessionsAPI.get(sid),
    enabled: !!sid,
  });

  const sessionEx = session?.sessionExercises.find((e) => e.id === seid);
  const nextOrder = (sessionEx?.sets.length ?? 0) + 1;

  const addSet = useMutation({
    mutationFn: () =>
      SessionsAPI.addSet(sid, seid, {
        setOrder: nextOrder,
        reps,
        weight: kg > 0 ? kg : undefined,
        restTime: rest,
        rpe: rpe,
      }),
    onSuccess: (s) => {
      s.warnings?.forEach((w) => toast.warning(w));
      toast.success(`Série ${nextOrder} salva`);
      qc.invalidateQueries({ queryKey: ["session", sid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!sid || !seid) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-fg-muted">
        <p>Sessão/exercício inválido</p>
        <Link to="/home" className="rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]">Voltar</Link>
      </div>
    );
  }

  if (isLoading || !sessionEx) {
    return <div className="h-full flex items-center justify-center text-fg-muted"><Loader2 className="animate-spin" size={20} /></div>;
  }

  return (
    <div className="h-full flex flex-col bg-surface text-fg anim-slide">
      <header className="flex items-center justify-between px-5 pt-6 shrink-0">
        <button onClick={() => navigate({ to: "/treino", search: { sid } })} className="btn-press">
          <ArrowLeft size={22} strokeWidth={1.6} />
        </button>
        <p className="label-caps-lg text-[12px]">SÉRIE</p>
        <span className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto olympus-scroll pb-5">
        <section className="px-5 mt-6">
          <h1 className="text-xl font-semibold">{sessionEx.exerciseName}</h1>
          <p className="text-xs text-fg-muted mt-1">{nextOrder}ª série</p>
        </section>

        <section className="px-5 mt-7 grid grid-cols-2 gap-3">
          <Stepper label="CARGA" value={kg} unit="kg" step={2.5} onChange={setKg} />
          <Stepper label="REPETIÇÕES" value={reps} unit="reps" step={1} onChange={setReps} />
        </section>

        <section className="px-5 mt-4">
          <Stepper label="DESCANSO" value={rest} unit="s" step={15} onChange={setRest} />
        </section>

        <section className="px-5 mt-7">
          <p className="label-caps text-fg-muted">RPE</p>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-5xl font-bold leading-none">{rpe}</div>
            <p className="text-xs text-fg-muted pb-2">Percepção de esforço</p>
          </div>
          <div className="mt-4 flex gap-1 h-3">
            {Array.from({ length: 10 }).map((_, i) => {
              const active = i < rpe;
              return (
                <button key={i} onClick={() => setRpe(i + 1)}
                  className={`flex-1 rounded-sm anim-seg origin-bottom ${active ? "bg-gold" : "bg-card border border-gold/20"}`}
                  style={{ animationDelay: `${i * 50}ms` }} aria-label={`RPE ${i + 1}`} />
              );
            })}
          </div>
        </section>

        <div className="px-5 mt-8">
          <button
            onClick={() => addSet.mutate()}
            disabled={addSet.isPending}
            className="w-full rounded-full bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60">
            {addSet.isPending ? "..." : "SALVAR SÉRIE"}
          </button>
        </div>

        <section className="px-5 mt-8">
          <div className="card p-5">
            <p className="label-caps text-fg-muted">HISTÓRICO</p>
            {sessionEx.sets.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">Nenhuma série ainda.</p>
            ) : (
              <ul className="mt-3 divide-y divide-divider">
                {sessionEx.sets.slice().sort((a, b) => a.setOrder - b.setOrder).map((s) => (
                  <li key={s.id} className="grid grid-cols-4 py-3 text-sm">
                    <span className="text-fg-muted">{s.setOrder}ª</span>
                    <span>{s.reps} reps</span>
                    <span>{s.weight ?? 0} kg</span>
                    <span className="text-right text-gold">RPE {s.rpe ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stepper({ label, value, unit, step, onChange }:
  { label: string; value: number; unit: string; step: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="label-caps text-fg-muted">{label}</p>
      <div className="mt-2 card p-3 flex items-center gap-2">
        <button onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
          className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center btn-press">
          <Minus size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-fg-muted ml-1">{unit}</span>
        </div>
        <button onClick={() => onChange(+(value + step).toFixed(2))}
          className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center btn-press">
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
