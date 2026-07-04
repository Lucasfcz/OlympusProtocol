import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Timer, Check, Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ExercisesAPI, SessionsAPI, type WorkoutSessionResponse } from "@/lib/api";

export const Route = createFileRoute("/treino")({
  validateSearch: (s: Record<string, unknown>) => ({ sid: (s.sid as string) || "" }),
  head: () => ({
    meta: [
      { title: "Treino — Olympus Protocol" },
      { name: "description", content: "Sessão de treino guiada." },
    ],
  }),
  component: WorkoutSession,
});

function WorkoutSession() {
  const { sid } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sid],
    queryFn: () => SessionsAPI.get(sid),
    enabled: !!sid,
  });

  useEffect(() => {
    session?.warnings?.forEach((w) => toast.warning(w));
  }, [session]);

  const finish = useMutation({
    mutationFn: () => SessionsAPI.finish(sid),
    onSuccess: (r) => {
      toast.success(`Treino finalizado · ${Math.round(r.totalVolume)}kg`);
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      navigate({ to: "/home" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addExercise = useMutation({
    mutationFn: async ({ exerciseId }: { exerciseId: string }) => {
      const currentOrder = (session?.sessionExercises.length ?? 0) + 1;
      const updated = await SessionsAPI.addExercise(sid, { exerciseId, exerciseOrder: currentOrder });
      // Auto-create first empty set
      const newEx = updated.sessionExercises.find((e) => e.exerciseId === exerciseId && e.sets.length === 0);
      if (newEx) {
        await SessionsAPI.addSet(sid, newEx.id, { setOrder: 1, reps: 0, weight: 0, restTime: 60, rpe: 7 });
      }
      return updated;
    },
    onSuccess: () => {
      toast.success("Exercício adicionado");
      qc.invalidateQueries({ queryKey: ["session", sid] });
      setPickerOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addEmptySet = useMutation({
    mutationFn: ({ seid, order }: { seid: string; order: number }) =>
      SessionsAPI.addSet(sid, seid, { setOrder: order, reps: 0, weight: 0, restTime: 60, rpe: 7 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!sid) return <EmptyState msg="Sessão inválida" />;
  if (isLoading || !session) {
    return <div className="h-full flex items-center justify-center text-fg-muted"><Loader2 className="animate-spin" size={20} /></div>;
  }

  const exercises = session.sessionExercises.slice().sort((a, b) => a.exerciseOrder - b.exerciseOrder);
  const withSets = exercises.filter((e) => e.sets.length > 0).length;
  const pct = exercises.length ? (withSets / exercises.length) * 100 : 0;
  const isFree = !session.workoutDayId;

  return (
    <div className="h-full flex flex-col bg-surface text-fg anim-slide">
      <header className="flex items-center justify-between px-5 pt-6 shrink-0">
        <Link to="/home" className="btn-press"><ArrowLeft size={22} strokeWidth={1.6} /></Link>
        <p className="label-caps-lg text-[12px]">{isFree ? "SESSÃO LIVRE" : "TREINO"}</p>
        <button className="btn-press"><Timer size={20} strokeWidth={1.6} /></button>
      </header>

      <section className="px-5 mt-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">{session.workoutDayName || "Sessão Livre"}</h1>
        <p className="text-xs text-fg-muted mt-1">
          {withSets}/{exercises.length} exercícios com séries · {Math.round(session.totalVolume)} kg
        </p>
        <div className="mt-3 h-1.5 bg-fg/10 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full anim-bar"
            style={{ width: `${pct}%`, ["--bar-scale" as string]: "1" }} />
        </div>
      </section>

      <ul className="flex-1 overflow-y-auto olympus-scroll px-5 mt-6 space-y-3 pb-4">
        {exercises.length === 0 && (
          <li className="rounded-lg bg-card p-6 text-center text-sm text-fg-muted border border-divider">
            {isFree ? "Adicione um exercício para começar." : "Sessão sem exercícios."}
          </li>
        )}
        {exercises.map((ex) => {
          const done = ex.sets.length > 0;
          return (
            <li key={ex.id} className="rounded-lg bg-card border border-divider overflow-hidden">
              <button
                onClick={() => navigate({ to: "/serie", search: { sid, seid: ex.id } })}
                className="w-full p-4 flex items-center gap-3 btn-press text-left"
              >
                <div className="w-10 h-10 rounded-full bg-card-2 border border-gold/30 flex items-center justify-center text-gold text-[11px] font-semibold">
                  {ex.exerciseOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{ex.exerciseName}</div>
                  <div className="text-xs text-fg-muted">
                    {ex.sets.length} séries · {Math.round(ex.exerciseVolume)} kg
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                  done ? "bg-gold border-gold" : "border-fg/30"
                }`}>
                  {done && <Check size={16} className="text-obsidian anim-check" strokeWidth={2.5} />}
                </div>
              </button>
              <button
                onClick={() => addEmptySet.mutate({ seid: ex.id, order: ex.sets.length + 1 })}
                disabled={addEmptySet.isPending}
                className="w-full py-2 border-t border-divider label-caps text-gold text-[10px] flex items-center justify-center gap-1 btn-press"
              >
                <Plus size={12} /> ADICIONAR SÉRIE
              </button>
            </li>
          );
        })}

        {isFree && (
          <li>
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full rounded-lg border border-dashed border-gold/40 bg-card/50 p-4 flex items-center justify-center gap-2 label-caps text-gold text-[11px] btn-press"
            >
              <Plus size={14} /> ADICIONAR EXERCÍCIO
            </button>
          </li>
        )}
      </ul>

      <div className="shrink-0 px-5 pt-3 pb-5 bg-surface border-t border-divider">
        <button
          onClick={() => finish.mutate()}
          disabled={finish.isPending}
          className="w-full rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60"
        >
          {finish.isPending ? "..." : "FINALIZAR SESSÃO"}
        </button>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onClose={() => setPickerOpen(false)}
          onPick={(id) => addExercise.mutate({ exerciseId: id })}
          busy={addExercise.isPending}
        />
      )}
    </div>
  );
}

function ExercisePicker({ onClose, onPick, busy }: {
  onClose: () => void; onPick: (id: string) => void; busy: boolean;
}) {
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["exercises", "picker", q],
    queryFn: () => ExercisesAPI.list({ name: q || undefined }, { page: 0, size: 30 }),
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-[380px] max-h-[80vh] rounded-t-2xl sm:rounded-lg bg-card border border-gold/30 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-divider">
          <p className="label-caps text-gold text-[11px]">ADICIONAR EXERCÍCIO</p>
          <button onClick={onClose} className="btn-press text-fg-muted"><X size={18} /></button>
        </div>
        <label className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-card-2 border border-divider px-3 py-2">
          <Search size={16} className="text-gold" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar exercício…"
            className="flex-1 bg-transparent focus:outline-none text-sm placeholder:text-fg-muted" />
        </label>
        <ul className="flex-1 overflow-y-auto olympus-scroll p-3 space-y-1.5">
          {list.isLoading && <li className="text-center py-4 text-fg-muted"><Loader2 className="animate-spin inline" size={16} /></li>}
          {list.data?.content.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onPick(e.id)}
                disabled={busy}
                className="w-full text-left rounded-lg bg-card-2 border border-divider p-3 btn-press disabled:opacity-50"
              >
                <div className="text-sm font-medium">{e.name}</div>
                <div className="text-[10px] text-fg-muted mt-0.5">
                  {e.muscles.slice(0, 3).map((m) => m.muscleGroup).join(" · ")}
                </div>
              </button>
            </li>
          ))}
          {list.data?.content.length === 0 && (
            <li className="text-center text-[12px] text-fg-muted py-4">Nenhum exercício encontrado.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-fg-muted">
      <p>{msg}</p>
      <Link to="/home" className="rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]">
        Voltar
      </Link>
    </div>
  );
}

export type _S = WorkoutSessionResponse;
