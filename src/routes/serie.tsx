import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExercisesAPI,
  PlansAPI,
  SessionsAPI,
  type WorkoutSessionSetResponse,
} from "@/lib/api";

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

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sid],
    queryFn: () => SessionsAPI.get(sid),
    enabled: !!sid,
  });

  const sessionEx = session?.sessionExercises.find((e) => e.id === seid);

  const exercise = useQuery({
    queryKey: ["exercise", sessionEx?.exerciseId],
    queryFn: () => ExercisesAPI.get(sessionEx!.exerciseId),
    enabled: !!sessionEx?.exerciseId,
  });

  const isBodyWeight = exercise.data?.usesBodyWeight ?? false;

  const plans = useQuery({
    queryKey: ["plans", "for-serie"],
    queryFn: () => PlansAPI.list({ page: 0, size: 20 }),
    enabled: !!session?.workoutDayId,
  });

  const planDay = plans.data?.content
    .flatMap((p) => p.days)
    .find((d) => d.id === session?.workoutDayId);

  const expectedTotal = planDay?.exercises.find((e) => e.exerciseId === sessionEx?.exerciseId)?.sets;

  const sortedSets = useMemo(
    () => sessionEx?.sets.slice().sort((a, b) => a.setOrder - b.setOrder) ?? [],
    [sessionEx?.sets],
  );

  const completedCount = sortedSets.filter((set) => set.isCompleted).length;
  const nextOrder = sortedSets.length + 1;
  const totalDisplay = Math.max(expectedTotal ?? 0, sortedSets.length, nextOrder);

  useEffect(() => {
    session?.warnings?.forEach((warning) => toast.warning(warning));
  }, [session]);

  const addExtraSet = useMutation({
    mutationFn: () => {
      const lastSet = sortedSets.at(-1);
      return SessionsAPI.addSet(sid, seid, {
        setOrder: nextOrder,
        reps: lastSet?.reps ?? 0,
        restTime: lastSet?.restTime ?? 90,
      });
    },
    onSuccess: () => {
      toast.success(`Série ${nextOrder} adicionada`);
      qc.invalidateQueries({ queryKey: ["session", sid] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeSet = (setId: string) => {
    if (!confirm("Remover esta série?")) return;
    void SessionsAPI.removeSet(sid, seid, setId)
      .then(() => qc.invalidateQueries({ queryKey: ["session", sid] }))
      .catch((error: Error) => toast.error(error.message));
  };

  if (!sid || !seid) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-fg-muted">
        <p>Sessão/exercício inválido</p>
        <Link to="/home" className="rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]">
          Voltar
        </Link>
      </div>
    );
  }

  if (isLoading || !sessionEx || exercise.isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-fg-muted">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface text-fg anim-slide">
      <header className="flex items-center justify-between px-5 pt-6 shrink-0">
        <button onClick={() => navigate({ to: "/treino", search: { sid } })} className="btn-press">
          <ArrowLeft size={22} strokeWidth={1.6} />
        </button>
        <p className="label-caps-lg text-[12px]">SÉRIE {Math.min(completedCount + 1, totalDisplay)} DE {totalDisplay}</p>
        <span className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto olympus-scroll pb-5">
        <section className="px-5 mt-6">
          <h1 className="text-xl font-semibold">{sessionEx.exerciseName}</h1>
          <p className="mt-1 text-xs text-fg-muted">
            {completedCount}/{totalDisplay} séries concluídas
          </p>

          <div className="mt-4 flex gap-1 h-2">
            {Array.from({ length: totalDisplay }).map((_, index) => {
              const done = index < completedCount;
              const current = index === completedCount;
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-full ${done ? "bg-gold" : current ? "bg-gold/40" : "bg-fg/10"}`}
                />
              );
            })}
          </div>
        </section>

        <section className="px-5 mt-7 space-y-3">
          {sortedSets.map((set) => (
            <SetCard
              key={set.id}
              sessionId={sid}
              sessionExerciseId={seid}
              set={set}
              isBodyWeight={isBodyWeight}
              onRemove={removeSet}
            />
          ))}
        </section>

        <div className="px-5 mt-7">
          <button
            onClick={() => addExtraSet.mutate()}
            disabled={addExtraSet.isPending}
            className="w-full rounded-lg border border-gold/40 bg-card/60 text-gold py-3 label-caps text-[11px] btn-press disabled:opacity-60 flex items-center justify-center gap-1"
          >
            <Plus size={13} /> {addExtraSet.isPending ? "..." : "ADICIONAR SÉRIE EXTRA"}
          </button>
        </div>

        <section className="px-5 mt-7">
          <div className="card p-4">
            <p className="label-caps text-fg-muted">SÉRIES ANTERIORES</p>
            {sortedSets.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">Nenhuma série ainda.</p>
            ) : (
              <ul className="mt-2 divide-y divide-divider">
                {sortedSets.map((set) => (
                  <li key={set.id} className="grid grid-cols-5 items-center py-2.5 text-sm gap-2">
                    <span className="text-fg-muted text-[11px]">{set.setOrder}ª</span>
                    <span className="tabular-nums">{set.reps ?? "—"} reps</span>
                    <span className="tabular-nums">{set.weight ?? "—"} kg</span>
                    <span className="text-right text-gold text-[11px]">RPE {set.rpe ?? "—"}</span>
                    <button
                      onClick={() => removeSet(set.id)}
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

function SetCard({
  sessionId,
  sessionExerciseId,
  set,
  isBodyWeight,
  onRemove,
}: {
  sessionId: string;
  sessionExerciseId: string;
  set: WorkoutSessionSetResponse;
  isBodyWeight: boolean;
  onRemove: (setId: string) => void;
}) {
  const qc = useQueryClient();
  const [repsDraft, setRepsDraft] = useState(String(set.reps ?? ""));
  const [weightDraft, setWeightDraft] = useState(set.weight == null ? "" : String(set.weight));
  const [rpeDraft, setRpeDraft] = useState(set.rpe == null ? "" : String(set.rpe));

  useEffect(() => {
    setRepsDraft(String(set.reps ?? ""));
    setWeightDraft(set.weight == null ? "" : String(set.weight));
    setRpeDraft(set.rpe == null ? "" : String(set.rpe));
  }, [set.id, set.reps, set.weight, set.rpe]);

  const register = useMutation({
    mutationFn: async () => {
      const repsValue = Number(repsDraft.replace(",", "."));
      if (!Number.isFinite(repsValue) || repsValue < 1) {
        throw new Error("Informe um número válido de reps maior que zero.");
      }

      let weightValue: number | undefined;
      if (!isBodyWeight) {
        if (!weightDraft.trim()) {
          throw new Error("Informe o peso da série.");
        }
        const parsedWeight = Number(weightDraft.replace(",", "."));
        if (!Number.isFinite(parsedWeight) || parsedWeight < 0 || parsedWeight >= 1000) {
          throw new Error("Informe um peso válido.");
        }
        weightValue = parsedWeight;
      }

      if (!rpeDraft.trim()) {
        throw new Error("Informe o RPE da série.");
      }
      const rpeValue = Number(rpeDraft.replace(",", "."));
      if (!Number.isFinite(rpeValue) || rpeValue < 0 || rpeValue > 10) {
        throw new Error("O RPE deve estar entre 0 e 10.");
      }

      const updatedSession = await SessionsAPI.updateSet(sessionId, set.id, {
        setOrder: set.setOrder,
        reps: Math.round(repsValue),
        weight: weightValue,
        rpe: rpeValue,
      });

      const updatedSet = updatedSession.sessionExercises
        .find((exercise) => exercise.id === sessionExerciseId)
        ?.sets.find((candidate) => candidate.id === set.id);

      if (!updatedSet) {
        throw new Error("Não foi possível localizar a série atualizada.");
      }

      return SessionsAPI.finishSet(sessionId, updatedSet.id);
    },
    onSuccess: (finishedSet) => {
      toast.success(`Série ${finishedSet.setOrder} registrada`);
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className={`rounded-xl border p-4 ${set.isCompleted ? "bg-card border-divider" : "bg-card/70 border-gold/30"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps text-gold text-[10px]">SÉRIE {set.setOrder}</p>
          <h2 className="mt-1 text-sm font-semibold">{set.isCompleted ? "Concluída" : "Pendente"}</h2>
        </div>
        <button
          onClick={() => onRemove(set.id)}
          className="text-fg-muted/60 hover:text-red-400 btn-press"
          aria-label="Remover série"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {set.isCompleted ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <MetaPill label="REPS" value={`${set.reps ?? "—"}`} />
            <MetaPill label="PESO" value={`${set.weight ?? "—"} kg`} />
            <MetaPill label="RPE" value={`${set.rpe ?? "—"}`} />
            <MetaPill label="DESCANSO" value={`${set.restTime ?? "—"} s`} />
          </div>

          {!!set.musclesVolumes?.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {set.musclesVolumes.map((volume) => (
                <span
                  key={volume.muscleGroup}
                  className="rounded-full border border-gold/25 bg-gold/5 px-2.5 py-1 text-[10px] text-gold"
                >
                  {volume.muscleGroup}: {Math.round(volume.totalVolume)}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            <FieldInput
              label="REPS"
              value={repsDraft}
              onChange={setRepsDraft}
              inputMode="numeric"
              placeholder="10"
              helperText="Editável antes de registrar"
            />

            <div className="rounded-lg border border-divider bg-card-2/60 px-3 py-2.5">
              <p className="label-caps text-fg-muted text-[9px]">DESCANSO</p>
              <p className="mt-1 text-sm">{set.restTime ?? 0}s</p>
            </div>

            {!isBodyWeight ? (
              <FieldInput
                label="PESO"
                value={weightDraft}
                onChange={setWeightDraft}
                inputMode="decimal"
                placeholder="0"
                helperText="Obrigatório para completar"
              />
            ) : (
              <div className="rounded-lg border border-divider bg-card-2/60 px-3 py-2.5">
                <p className="label-caps text-fg-muted text-[9px]">PESO</p>
                <p className="mt-1 text-xs text-fg-muted">Peso corporal será calculado automaticamente.</p>
              </div>
            )}

            <FieldInput
              label="RPE"
              value={rpeDraft}
              onChange={setRpeDraft}
              inputMode="decimal"
              placeholder="0 a 10"
              helperText="Obrigatório para completar"
            />
          </div>

          <button
            onClick={() => register.mutate()}
            disabled={register.isPending}
            className="mt-4 w-full rounded-lg bg-gold text-obsidian py-3.5 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60"
          >
            {register.isPending ? "..." : "REGISTRAR SÉRIE"}
          </button>
        </>
      )}
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  inputMode,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder: string;
  helperText?: string;
}) {
  return (
    <label className="block rounded-lg border border-divider bg-card-2/60 px-3 py-2.5">
      <span className="label-caps text-fg-muted text-[9px]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm focus:outline-none"
      />
      {helperText && <p className="mt-1 text-[11px] text-fg-muted">{helperText}</p>}
    </label>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-divider bg-card-2/50 px-3 py-2">
      <p className="label-caps text-fg-muted text-[9px]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
