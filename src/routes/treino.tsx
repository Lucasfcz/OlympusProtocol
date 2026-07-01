import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Timer, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MuscleIcon } from "@/components/olympus/Icons";
import { SessionsAPI, type WorkoutSessionResponse } from "@/lib/api";
import { useEffect } from "react";

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

function muscleKind(name: string) {
  const n = name.toLowerCase();
  if (n.includes("tríceps") || n.includes("triceps")) return "triceps";
  return "peito";
}

function WorkoutSession() {
  const { sid } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  if (!sid) {
    return <EmptyState msg="Sessão inválida" />;
  }
  if (isLoading || !session) {
    return (
      <div className="h-full flex items-center justify-center text-fg-muted">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  const exercises = session.sessionExercises.slice().sort((a, b) => a.exerciseOrder - b.exerciseOrder);
  const withSets = exercises.filter((e) => e.sets.length > 0).length;
  const pct = exercises.length ? (withSets / exercises.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-surface text-fg anim-slide">
      <header className="flex items-center justify-between px-5 pt-6 shrink-0">
        <Link to="/home" className="btn-press"><ArrowLeft size={22} strokeWidth={1.6} /></Link>
        <p className="label-caps-lg text-[12px]">TREINO</p>
        <button className="btn-press"><Timer size={20} strokeWidth={1.6} /></button>
      </header>

      <section className="px-5 mt-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">{session.workoutDayName || "Sessão Livre"}</h1>
        <p className="text-xs text-fg-muted mt-1">{withSets}/{exercises.length} exercícios com séries · {Math.round(session.totalVolume)} kg</p>
        <div className="mt-3 h-1.5 bg-fg/10 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full anim-bar"
            style={{ width: `${pct}%`, ["--bar-scale" as string]: "1" }} />
        </div>
      </section>

      <ul className="flex-1 overflow-y-auto olympus-scroll px-5 mt-6 space-y-3 pb-4">
        {exercises.length === 0 && (
          <li className="card p-6 text-center text-sm text-fg-muted">
            Sessão sem exercícios. Adicione exercícios à sessão via API.
          </li>
        )}
        {exercises.map((ex) => {
          const done = ex.sets.length > 0;
          return (
            <li key={ex.id}
              onClick={() => navigate({ to: "/serie", search: { sid, seid: ex.id } })}
              className="card p-4 flex items-center gap-3 btn-press cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-card-2 flex items-center justify-center text-fg/70">
                <MuscleIcon kind={muscleKind(ex.exerciseName)} className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[15px]">{ex.exerciseName}</div>
                <div className="text-xs text-fg-muted">
                  {ex.sets.length} séries · {Math.round(ex.exerciseVolume)} kg
                </div>
              </div>
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                done ? "bg-gold border-gold" : "border-fg/30"
              }`}>
                {done && <Check size={16} className="text-obsidian anim-check" strokeWidth={2.5} />}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 px-5 pt-3 pb-5 bg-surface border-t border-divider">
        <button
          onClick={() => finish.mutate()}
          disabled={finish.isPending}
          className="w-full rounded-full bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60">
          {finish.isPending ? "..." : "FINALIZAR TREINO"}
        </button>
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

// unused helper kept for typing (silences ts unused)
export type _S = WorkoutSessionResponse;
