import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PlansAPI, SessionsAPI } from "@/lib/api";

export const Route = createFileRoute("/dia")({
  validateSearch: (s: Record<string, unknown>) => ({
    pid: (s.pid as string) || "",
    did: (s.did as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Preview do dia — Olympus Protocol" },
      { name: "description", content: "Prévia dos exercícios do dia antes de iniciar." },
    ],
  }),
  component: DayPreview,
});

const weekAbbr = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

function inferGroups(names: string[]) {
  const s = new Set<string>();
  names.forEach((n) => {
    const l = n.toLowerCase();
    if (l.includes("supino") || l.includes("crucifi")) s.add("PEITO");
    if (l.includes("desenvolv") || l.includes("elevaç")) s.add("OMBRO");
    if (l.includes("tríc") || l.includes("tric")) s.add("TRÍCEPS");
    if (l.includes("rem") || l.includes("puxa")) s.add("COSTAS");
    if (l.includes("bíc") || l.includes("bic") || l.includes("rosca")) s.add("BÍCEPS");
    if (l.includes("agach") || l.includes("leg")) s.add("QUADRÍCEPS");
    if (l.includes("stiff") || l.includes("posterior")) s.add("POSTERIOR");
  });
  return Array.from(s);
}

function DayPreview() {
  const { pid, did } = Route.useSearch();
  const navigate = useNavigate();
  const plan = useQuery({ queryKey: ["plan", pid], queryFn: () => PlansAPI.get(pid), enabled: !!pid });
  const day = plan.data?.days.find((d) => d.id === did);

  const start = useMutation({
    mutationFn: () => SessionsAPI.createFromPlan(did),
    onSuccess: (s) => {
      s.warnings?.forEach((w) => toast.warning(w));
      navigate({ to: "/treino", search: { sid: s.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (plan.isLoading) {
    return <div className="h-full flex items-center justify-center text-fg-muted"><Loader2 className="animate-spin" size={20} /></div>;
  }
  if (!day) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-fg-muted p-6 text-center">
        <p>Dia não encontrado.</p>
        <Link to="/treinos" className="rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]">Voltar</Link>
      </div>
    );
  }

  const exercises = day.exercises.slice().sort((a, b) => a.exerciseOrder - b.exerciseOrder);
  const groups = inferGroups(exercises.map((e) => e.exerciseName));
  const weekIdx = Math.max(0, (day.dayOrder - 1) % 7);

  return (
    <div className="h-full flex flex-col bg-surface text-fg anim-slide">
      <header className="px-5 pt-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/treinos" className="btn-press"><ArrowLeft size={22} strokeWidth={1.6} /></Link>
          <div>
            <p className="label-caps text-fg-muted text-[10px]">
              {weekAbbr[weekIdx]}-FEIRA · {plan.data?.name}
            </p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{day.name}</h1>
          </div>
        </div>
        {groups.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {groups.map((g) => (
              <span key={g} className="label-caps text-[10px] text-gold rounded-full border border-gold/40 px-2.5 py-1">
                {g}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="px-5 mt-6 shrink-0">
        <p className="label-caps text-fg-muted text-[10px]">{exercises.length} EXERCÍCIOS</p>
      </div>

      <ul className="flex-1 overflow-y-auto olympus-scroll px-5 mt-3 space-y-2.5 pb-4">
        {exercises.map((ex, i) => (
          <li key={ex.id} className="rounded-lg bg-card border border-divider px-4 py-3 flex items-center gap-3">
            <span className="text-fg-muted/70 tabular-nums text-sm w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{ex.exerciseName}</div>
              <div className="text-[10px] text-fg-muted">Musculação</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-gold font-semibold text-[13px]">{ex.sets}×</div>
              <div className="text-[10px] text-fg-muted">{ex.reps}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="shrink-0 px-5 pt-3 pb-5 bg-surface border-t border-divider">
        <button
          onClick={() => start.mutate()}
          disabled={start.isPending}
          className="w-full rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {start.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          COMEÇAR SESSÃO
        </button>
      </div>
    </div>
  );
}
