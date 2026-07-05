import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, TrendingDown, Clock, Dumbbell } from "lucide-react";
import { SessionsAPI, type MuscleGroup } from "@/lib/api";

export const Route = createFileRoute("/resumo/$sessionId")({
  head: () => ({
    meta: [
      { title: "Resumo — Olympus Protocol" },
      { name: "description", content: "Resumo detalhado da sessão de treino finalizada." },
    ],
  }),
  component: SessionSummary,
});

const muscleLabel: Record<MuscleGroup, string> = {
  CHEST: "Peito", BACK: "Costas", SHOULDERS: "Ombro",
  BICEPS: "Bíceps", TRICEPS: "Tríceps", FOREARMS: "Antebraço",
  QUADRICEPS: "Quadríceps", HAMSTRINGS: "Posterior", GLUTES: "Glúteo",
  CALVES: "Panturrilha", ABS: "Abdômen",
};

function SessionSummary() {
  const { sessionId } = Route.useParams();
  const summary = useQuery({
    queryKey: ["session", sessionId, "summary"],
    queryFn: () => SessionsAPI.summary(sessionId),
  });

  if (summary.isLoading || !summary.data) {
    return <div className="h-full flex items-center justify-center text-fg-muted"><Loader2 className="animate-spin" size={20} /></div>;
  }
  const s = summary.data;

  return (
    <div className="h-full flex flex-col bg-surface text-fg anim-fade">
      <div className="flex-1 overflow-y-auto olympus-scroll px-5 pt-8 pb-5">
        <p className="label-caps text-gold text-[11px]">TREINO CONCLUÍDO</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{s.workoutDayName ?? "Sessão Livre"}</h1>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric icon={<Dumbbell size={16} className="text-gold" />}
                  label="VOLUME" value={`${Math.round(s.totalVolume)}`} unit="kg" />
          <Metric icon={<Clock size={16} className="text-gold" />}
                  label="DURAÇÃO" value={String(s.durationMinutes)} unit="min" />
        </div>

        <p className="label-caps text-fg-muted text-[10px] mt-8">EXERCÍCIOS</p>
        <ul className="mt-2 space-y-2">
          {s.exercises.map((ex) => (
            <li key={ex.id} className="rounded-lg bg-card border border-divider p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold truncate pr-2">{ex.exerciseName}</div>
                <div className="text-gold text-[13px] font-semibold tabular-nums">
                  {Math.round(ex.exerciseVolume)} kg
                </div>
              </div>
              <div className="text-[11px] text-fg-muted mt-0.5">
                {ex.sets.length} séries
              </div>
            </li>
          ))}
        </ul>

        {s.totalMuscleVolumes.length > 0 && (
          <>
            <p className="label-caps text-fg-muted text-[10px] mt-8">VOLUME POR GRUPO</p>
            <ul className="mt-2 space-y-1.5">
              {s.totalMuscleVolumes.map((m) => {
                const change = s.muscleVolumeChanges?.find((c) => c.muscleGroup === m.muscleGroup);
                return (
                  <li key={m.muscleGroup} className="rounded-lg bg-card border border-divider px-3 py-2 flex items-center justify-between">
                    <span className="text-sm">{muscleLabel[m.muscleGroup]}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-sm">{Math.round(m.totalVolume)} kg</span>
                      {change && change.previousVolume > 0 && (
                        <span className={`label-caps text-[10px] flex items-center gap-0.5 ${
                          change.percentageChange >= 0 ? "text-gold" : "text-red-400"
                        }`}>
                          {change.percentageChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {Math.abs(change.percentageChange).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="shrink-0 px-5 pt-3 pb-5 border-t border-divider bg-surface">
        <Link to="/home"
          className="w-full block text-center rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold">
          VOLTAR AO INÍCIO
        </Link>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-card border-2 p-4" style={{ borderColor: "#C9A24B" }}>
      <div className="flex items-center gap-1.5">{icon}<span className="label-caps text-fg-muted text-[10px]">{label}</span></div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-xs text-fg-muted">{unit}</span>
      </div>
    </div>
  );
}
