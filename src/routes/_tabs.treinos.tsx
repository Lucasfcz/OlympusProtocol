import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, ChevronRight, Play, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlansAPI, SessionsAPI, type Goal, type WorkoutPlanResponse } from "@/lib/api";

export const Route = createFileRoute("/_tabs/treinos")({
  head: () => ({
    meta: [
      { title: "Treinos — Olympus Protocol" },
      { name: "description", content: "Seus planos de treino." },
    ],
  }),
  component: Treinos,
});

const goals: { value: Goal; label: string }[] = [
  { value: "HYPERTROPHY", label: "Hipertrofia" },
  { value: "STRENGTH", label: "Força" },
  { value: "FAT_LOSS", label: "Queima" },
  { value: "ENDURANCE", label: "Resistência" },
];

function Treinos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [confirmActive, setConfirmActive] = useState<WorkoutPlanResponse | null>(null);
  const [pendingCreate, setPendingCreate] = useState<{ name: string; goal: Goal } | null>(null);

  const { data: plans = [], isLoading } = useQuery({ queryKey: ["plans"], queryFn: PlansAPI.list });
  const activePlan = plans.find((p) => p.active);

  const createMut = useMutation({
    mutationFn: (d: { name: string; goal: Goal }) => PlansAPI.create(d),
    onSuccess: (plan) => {
      plan.warnings?.forEach((w) => toast.warning(w));
      toast.success("Plano criado.");
      qc.invalidateQueries({ queryKey: ["plans"] });
      setCreating(false);
      setConfirmActive(null);
      setPendingCreate(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startPlan = async (dayId: string) => {
    try {
      const s = await SessionsAPI.createFromPlan(dayId);
      s.warnings?.forEach((w) => toast.warning(w));
      navigate({ to: "/treino", search: { sid: s.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível iniciar");
    }
  };

  const requestCreate = (d: { name: string; goal: Goal }) => {
    if (activePlan) {
      setPendingCreate(d);
      setConfirmActive(activePlan);
    } else {
      createMut.mutate(d);
    }
  };

  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-5">
      <header className="flex items-center justify-between">
        <p className="label-caps text-fg-muted">PLANOS</p>
        <p className="label-caps-lg text-[12px]">TREINOS</p>
        <button onClick={() => setCreating((v) => !v)} className="btn-press text-gold">
          <Plus size={20} strokeWidth={1.8} />
        </button>
      </header>

      {creating && (
        <CreatePlanForm
          onSubmit={requestCreate}
          busy={createMut.isPending}
          onCancel={() => setCreating(false)}
        />
      )}

      <h1 className="text-2xl font-bold mt-5 tracking-tight">Sua Programação</h1>
      <p className="text-xs text-fg-muted mt-1">
        {plans.length} {plans.length === 1 ? "plano" : "planos"} · {activePlan ? `ativo: ${activePlan.name}` : "sem plano ativo"}
      </p>

      {isLoading && (
        <div className="mt-8 flex justify-center text-fg-muted">
          <Loader2 className="animate-spin" size={20} />
        </div>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="mt-10 card p-6 text-center">
          <p className="text-sm text-fg-muted">Você ainda não tem planos.</p>
          <button onClick={() => setCreating(true)}
            className="mt-4 rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]">
            CRIAR PRIMEIRO PLANO
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {plans.map((p) => (
          <li key={p.id} className={`card p-4 ${p.active ? "border-gold/60" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center text-gold">
                <Dumbbell size={16} strokeWidth={1.6} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[15px]">{p.name}</div>
                <div className="text-[11px] text-fg-muted mt-0.5">
                  {p.goal} · {p.days.length} dias {p.active && "· ATIVO"}
                </div>
              </div>
            </div>
            {p.days.length > 0 && (
              <ul className="mt-3 divide-y divide-divider">
                {p.days.slice().sort((a, b) => a.dayOrder - b.dayOrder).map((d) => (
                  <li key={d.id} className="py-2.5 flex items-center gap-3">
                    <div className="text-[10px] label-caps text-fg-muted w-8">D{d.dayOrder}</div>
                    <div className="flex-1">
                      <div className="text-sm">{d.name}</div>
                      <div className="text-[10px] text-fg-muted">{d.exercises.length} exercícios</div>
                    </div>
                    <button onClick={() => startPlan(d.id)}
                      className="rounded-full bg-gold text-obsidian px-3 py-1.5 label-caps text-[10px] flex items-center gap-1 btn-press">
                      <Play size={10} fill="currentColor" /> Iniciar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <Link to="/conquistas" className="mt-6 mb-2 block text-center label-caps text-gold text-[11px]">
        VER CONQUISTAS →
      </Link>

      {confirmActive && pendingCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="card p-6 max-w-[340px] w-full bg-charcoal">
            <p className="label-caps text-gold text-[11px]">PLANO ATIVO EXISTENTE</p>
            <h3 className="mt-2 text-lg font-semibold">Substituir plano?</h3>
            <p className="mt-2 text-sm text-fg-muted">
              Você já tem o plano <b className="text-fg">{confirmActive.name}</b> ativo.
              Criar um novo vai desativá-lo. Deseja continuar?
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setConfirmActive(null); setPendingCreate(null); }}
                className="flex-1 rounded-full border border-gold/30 py-2.5 label-caps text-[10px]">
                Cancelar
              </button>
              <button onClick={() => createMut.mutate(pendingCreate)}
                disabled={createMut.isPending}
                className="flex-1 rounded-full bg-gold text-obsidian py-2.5 label-caps text-[10px]">
                {createMut.isPending ? "..." : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePlanForm({ onSubmit, onCancel, busy }: {
  onSubmit: (d: { name: string; goal: Goal }) => void;
  onCancel: () => void; busy: boolean;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  return (
    <div className="mt-4 card p-4">
      <p className="label-caps text-fg-muted text-[10px]">NOVO PLANO</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do plano"
        className="mt-2 w-full bg-transparent border border-gold/20 rounded-[8px] px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {goals.map((g) => (
          <button key={g.value} onClick={() => setGoal(g.value)}
            className={`py-2 rounded-[8px] label-caps text-[10px] border ${goal === g.value ? "bg-gold text-obsidian border-gold" : "border-gold/20 text-fg-muted"}`}>
            {g.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-full border border-gold/30 py-2 label-caps text-[10px]">Cancelar</button>
        <button
          onClick={() => name && onSubmit({ name, goal })}
          disabled={!name || busy}
          className="flex-1 rounded-full bg-gold text-obsidian py-2 label-caps text-[10px] disabled:opacity-60">
          {busy ? "..." : "Criar"}
        </button>
      </div>
    </div>
  );
}
