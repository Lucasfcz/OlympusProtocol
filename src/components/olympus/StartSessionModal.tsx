import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Play, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PlansAPI, SessionsAPI } from "@/lib/api";

export function StartSessionModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted?: () => void;
}) {
  const navigate = useNavigate();
  const plans = useQuery({
    queryKey: ["plans", "modal"],
    queryFn: () => PlansAPI.list({ page: 0, size: 20 }),
    enabled: open,
  });
  const activePlan = plans.data?.content.find((p) => p.active);
  const days = activePlan?.days.slice().sort((a, b) => a.dayOrder - b.dayOrder) ?? [];

  const startFree = useMutation({
    mutationFn: () => SessionsAPI.createFree(),
    onSuccess: (s) => {
      onStarted?.();
      onClose();
      navigate({ to: "/treino", search: { sid: s.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startFromDay = useMutation({
    mutationFn: (dayId: string) => SessionsAPI.createFromPlan(dayId),
    onSuccess: (s) => {
      s.warnings?.forEach((w) => toast.warning(w));
      onStarted?.();
      onClose();
      navigate({ to: "/treino", search: { sid: s.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open) return null;
  const busy = startFree.isPending || startFromDay.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="card p-5 w-full sm:max-w-[380px] bg-card rounded-t-2xl sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="label-caps text-gold text-[11px]">INICIAR SESSÃO</p>
          <button onClick={onClose} className="btn-press text-fg-muted"><X size={18} /></button>
        </div>

        <button
          disabled={busy}
          onClick={() => startFree.mutate()}
          className="mt-4 w-full rounded-lg border border-gold/30 bg-card-2 p-3.5 flex items-center gap-3 btn-press disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold">Sessão Livre</div>
            <div className="text-[11px] text-fg-muted">Monte na hora</div>
          </div>
          {startFree.isPending ? <Loader2 size={16} className="animate-spin text-gold" /> : <Play size={14} className="text-gold" fill="currentColor" />}
        </button>

        <p className="label-caps text-fg-muted text-[10px] mt-5 mb-2">
          {activePlan ? `PLANO ATIVO · ${activePlan.name}` : plans.isLoading ? "CARREGANDO…" : "SEM PLANO ATIVO"}
        </p>

        <ul className="space-y-2 max-h-[280px] overflow-y-auto olympus-scroll">
          {days.map((d) => (
            <li key={d.id} className="rounded-lg border border-divider bg-card-2 p-3 flex items-center gap-3">
              <div className="label-caps text-[10px] text-gold w-8">D{d.dayOrder}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{d.name}</div>
                <div className="text-[10px] text-fg-muted">{d.exercises.length} exercícios</div>
              </div>
              <button
                disabled={busy}
                onClick={() => startFromDay.mutate(d.id)}
                className="rounded-full bg-gold text-obsidian px-3 py-1.5 label-caps text-[10px] flex items-center gap-1 btn-press disabled:opacity-50"
              >
                {startFromDay.isPending && startFromDay.variables === d.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                Iniciar
              </button>
            </li>
          ))}
          {!plans.isLoading && days.length === 0 && (
            <li className="text-center text-[11px] text-fg-muted py-3">Crie um plano de treino em Plano.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
