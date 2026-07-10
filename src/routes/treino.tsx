import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Timer, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { PlansAPI, SessionsAPI } from "@/lib/api";
import { ExercisePickerSheet } from "@/components/olympus/ExercisePickerSheet";
import { useOptionalActiveSession } from "@/lib/active-session";

export const Route = createFileRoute("/treino")({
  validateSearch: (s: Record<string, unknown>) => ({ sid: (s.sid as string) || "" }),
  head: () => ({
    meta: [
      { title: "Treino — Olympus Protocol" },
      { name: "description", content: "Sessão de treino em andamento." },
    ],
  }),
  component: WorkoutSession,
});

function WorkoutSession() {
  const { sid } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const activeSession = useOptionalActiveSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sid],
    queryFn: () => SessionsAPI.get(sid),
    enabled: !!sid,
  });

  // Buscar plano correspondente ao dia (para saber sets esperados) — apenas no modo plano.
  const plans = useQuery({
    queryKey: ["plans", "for-session"],
    queryFn: () => PlansAPI.list({ page: 0, size: 20 }),
    enabled: !!session?.workoutDayId,
  });
  const planDay = plans.data?.content
    .flatMap((p) => p.days)
    .find((d) => d.id === session?.workoutDayId);
  const expectedSetsByExId = new Map<string, number>(
    planDay?.exercises.map((e) => [e.exerciseId, e.sets]) ?? [],
  );

  useEffect(() => {
    session?.warnings?.forEach((w) => toast.warning(w));
  }, [session]);

  const addExercise = useMutation({
    mutationFn: ({ exerciseId }: { exerciseId: string }) => {
      const order = (session?.sessionExercises.length ?? 0) + 1;
      return SessionsAPI.addExercise(sid, { exerciseId, exerciseOrder: order });
    },
    onSuccess: (s) => {
      showWarnings(s.warnings);
      toast.success("Exercício adicionado");
      qc.invalidateQueries({ queryKey: ["session", sid] });
      setPickerOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeExercise = useMutation({
    mutationFn: (seid: string) => SessionsAPI.removeExercise(sid, seid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sid] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!sid) return <EmptyState msg="Sessão inválida" />;
  if (isLoading || !session) {
    return <div className="h-full flex items-center justify-center text-fg-muted"><Loader2 className="animate-spin" size={20} /></div>;
  }

  const isFree = !session.workoutDayId;
  const exercises = session.sessionExercises.slice().sort((a, b) => a.exerciseOrder - b.exerciseOrder);

  // Completude
  const completedCount = exercises.filter((ex) => {
    const expected = expectedSetsByExId.get(ex.exerciseId);
    return expected ? ex.sets.length >= expected : ex.sets.length > 0;
  }).length;
  const pct = exercises.length ? (completedCount / exercises.length) * 100 : 0;

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
          {completedCount}/{exercises.length} exercícios · {Math.round(session.totalVolume)} kg
        </p>
        <div className="mt-3 h-1.5 bg-fg/10 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <ul className="flex-1 overflow-y-auto olympus-scroll px-5 mt-6 space-y-3 pb-4">
        {exercises.length === 0 && (
          <li className="rounded-lg bg-card p-6 text-center text-sm text-fg-muted border border-divider">
            {isFree ? "Adicione um exercício para começar." : "Sessão sem exercícios."}
          </li>
        )}
        {exercises.map((ex) => {
          const done = ex.sets.length;
          const expected = expectedSetsByExId.get(ex.exerciseId);
          const isDone = expected ? done >= expected : done > 0;
          return (
            <li key={ex.id} className="rounded-lg bg-card border border-divider overflow-hidden"
                style={{ borderLeftWidth: isDone ? 3 : 0, borderLeftColor: "#C9A24B" }}>
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
                    {expected ? `${done}/${expected} séries` : `${done} série${done === 1 ? "" : "s"}`}
                    {" · "}{Math.round(ex.exerciseVolume)} kg
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                  isDone ? "bg-gold border-gold" : "border-fg/30"
                }`}>
                  {isDone && <Check size={16} className="text-obsidian" strokeWidth={2.5} />}
                </div>
              </button>
              {isFree && (
                <button
                  onClick={() => {
                    if (confirm(`Remover ${ex.exerciseName} da sessão?`)) removeExercise.mutate(ex.id);
                  }}
                  className="w-full py-2 border-t border-divider label-caps text-fg-muted text-[10px] flex items-center justify-center gap-1 btn-press"
                >
                  <Trash2 size={11} /> REMOVER
                </button>
              )}
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
          onClick={() => setFinishOpen(true)}
          className="w-full rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold"
        >
          FINALIZAR TREINO
        </button>
      </div>

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => addExercise.mutate({ exerciseId: id })}
        busy={addExercise.isPending}
      />

      {finishOpen && (
        <FinishDialog
          sid={sid}
          onClose={() => setFinishOpen(false)}
          onDone={() => {
            void activeSession?.refresh();
            qc.invalidateQueries({ queryKey: ["sessions"] });
            qc.invalidateQueries({ queryKey: ["stats"] });
            navigate({ to: "/resumo/$sessionId", params: { sessionId: sid } });
          }}
        />
      )}
    </div>
  );
}

function FinishDialog({
  sid, onClose, onDone,
}: { sid: string; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState("");
  const finish = useMutation({
    mutationFn: () => SessionsAPI.finish(sid, notes.trim() || undefined),
    onSuccess: () => {
      toast.success("Treino finalizado.");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full sm:max-w-[380px] rounded-t-2xl sm:rounded-lg bg-card border border-gold/30 p-5"
        onClick={(e) => e.stopPropagation()}>
        <p className="label-caps text-gold text-[11px]">FINALIZAR TREINO</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          rows={3}
          className="mt-3 w-full bg-transparent border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold resize-none"
        />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-gold/30 py-2.5 label-caps text-[10px]">Cancelar</button>
          <button onClick={() => finish.mutate()} disabled={finish.isPending}
            className="flex-1 rounded-full bg-gold text-obsidian py-2.5 label-caps text-[10px] disabled:opacity-50">
            {finish.isPending ? "..." : "Finalizar"}
          </button>
        </div>
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

function showWarnings(ws?: string[]) {
  ws?.forEach((w) => toast.warning(w));
}
