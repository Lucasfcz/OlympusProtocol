import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlansAPI, SessionsAPI } from "@/lib/api";

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
  const [rpe, setRpe] = useState<number | null>(null);
  const [rest, setRest] = useState(90);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sid],
    queryFn: () => SessionsAPI.get(sid),
    enabled: !!sid,
  });

  const sessionEx = session?.sessionExercises.find((e) => e.id === seid);

  // Sets esperados (modo plano)
  const plans = useQuery({
    queryKey: ["plans", "for-serie"],
    queryFn: () => PlansAPI.list({ page: 0, size: 20 }),
    enabled: !!session?.workoutDayId,
  });
  const planDay = plans.data?.content
    .flatMap((p) => p.days)
    .find((d) => d.id === session?.workoutDayId);
  const expectedTotal = planDay?.exercises.find((e) => e.exerciseId === sessionEx?.exerciseId)?.sets;

  const sortedSets = sessionEx?.sets.slice().sort((a, b) => a.setOrder - b.setOrder) ?? [];
  const nextOrder = sortedSets.length + 1;
  const totalDisplay = expectedTotal ?? Math.max(sortedSets.length, nextOrder);

  // Pré-preencher com última série
  useEffect(() => {
    const last = sortedSets[sortedSets.length - 1];
    if (last) {
      setKg(last.weight ?? 0);
      setReps(last.reps);
      setRest(last.restTime ?? 90);
      if (last.rpe != null) setRpe(last.rpe);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEx?.id]);

  const saveSet = useMutation({
    mutationFn: async () => {
      const updatedSession = await SessionsAPI.addSet(sid, seid, {
        setOrder: nextOrder,
        reps,
        weight: kg > 0 ? kg : undefined,
        restTime: rest,
        rpe: rpe ?? undefined,
      });
      const updatedExercise = updatedSession.sessionExercises.find((exercise) => exercise.id === seid);
      const createdSet = updatedExercise?.sets
        .slice()
        .sort((a, b) => a.setOrder - b.setOrder)
        .find((set) => set.setOrder === nextOrder)
        ?? updatedExercise?.sets.slice().sort((a, b) => a.setOrder - b.setOrder).at(-1);

      if (!createdSet) {
        throw new Error("Não foi possível identificar a série salva.");
      }

      return SessionsAPI.finishSet(sid, createdSet.id);
    },
    onSuccess: (set) => {
      toast.success(`Série ${set.setOrder} salva`);
      qc.invalidateQueries({ queryKey: ["session", sid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSet = useMutation({
    mutationFn: (setId: string) => SessionsAPI.removeSet(sid, seid, setId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sid] }),
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
        <p className="label-caps-lg text-[12px]">SÉRIE {nextOrder} DE {totalDisplay}</p>
        <span className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto olympus-scroll pb-5">
        <section className="px-5 mt-6">
          <h1 className="text-xl font-semibold">{sessionEx.exerciseName}</h1>

          {/* Barra segmentada */}
          <div className="mt-4 flex gap-1 h-2">
            {Array.from({ length: totalDisplay }).map((_, i) => {
              const done = i < sortedSets.length;
              const current = i === sortedSets.length;
              return (
                <div key={i}
                  className={`flex-1 rounded-full ${
                    done ? "bg-gold" : current ? "bg-gold/40" : "bg-fg/10"
                  }`} />
              );
            })}
          </div>
        </section>

        <section className="px-5 mt-7 grid grid-cols-2 gap-3">
          <Stepper label="CARGA" value={kg} unit="kg" step={2.5} onChange={setKg} />
          <Stepper label="REPETIÇÕES" value={reps} unit="reps" step={1} onChange={setReps} />
        </section>

        <div className="px-5 mt-5">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="label-caps text-fg-muted text-[10px] flex items-center gap-1"
          >
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            AVANÇADO (RPE / DESCANSO)
          </button>
        </div>

        {showAdvanced && (
          <>
            <section className="px-5 mt-3">
              <Stepper label="DESCANSO" value={rest} unit="s" step={15} onChange={setRest} />
            </section>

            <section className="px-5 mt-5">
              <p className="label-caps text-fg-muted">RPE</p>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-4xl font-bold leading-none">{rpe ?? "—"}</div>
                <p className="text-xs text-fg-muted pb-1.5">Percepção de esforço</p>
              </div>
              <div className="mt-3 flex gap-1 h-3">
                {Array.from({ length: 10 }).map((_, i) => {
                  const active = rpe != null && i < rpe;
                  return (
                    <button key={i} onClick={() => setRpe(i + 1)}
                      className={`flex-1 rounded-sm ${active ? "bg-gold" : "bg-card border border-gold/20"}`}
                      aria-label={`RPE ${i + 1}`} />
                  );
                })}
              </div>
            </section>
          </>
        )}

        <div className="px-5 mt-7">
          <button
            onClick={() => saveSet.mutate()}
            disabled={saveSet.isPending}
            className="w-full rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60">
            {saveSet.isPending ? "..." : "SALVAR SÉRIE"}
          </button>
        </div>

        <section className="px-5 mt-7">
          <div className="card p-4">
            <p className="label-caps text-fg-muted">SÉRIES ANTERIORES</p>
            {sortedSets.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">Nenhuma série ainda.</p>
            ) : (
              <ul className="mt-2 divide-y divide-divider">
                {sortedSets.map((s) => (
                  <li key={s.id} className="grid grid-cols-5 items-center py-2.5 text-sm gap-2">
                    <span className="text-fg-muted text-[11px]">{s.setOrder}ª</span>
                    <span className="tabular-nums">{s.reps} reps</span>
                    <span className="tabular-nums">{s.weight ?? 0} kg</span>
                    <span className="text-right text-gold text-[11px]">RPE {s.rpe ?? "—"}</span>
                    <button
                      onClick={() => confirm("Remover esta série?") && removeSet.mutate(s.id)}
                      className="text-fg-muted/60 hover:text-red-400 justify-self-end"
                      aria-label="Remover série"
                    >
                      <Trash2 size={13} />
                    </button>
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
