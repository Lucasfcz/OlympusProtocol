import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, ChevronDown, ChevronUp, Pencil, Loader2, GripVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlansAPI, type Goal, type WorkoutDay, type WorkoutExercise, type WorkoutPlanResponse } from "@/lib/api";

export const Route = createFileRoute("/_tabs/treinos")({
  head: () => ({
    meta: [
      { title: "Plano — Olympus Protocol" },
      { name: "description", content: "Sua ficha de treinos: dias, exercícios e séries." },
    ],
  }),
  component: Treinos,
});

const weekAbbr = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const goals: { value: Goal; label: string }[] = [
  { value: "HYPERTROPHY", label: "Hipertrofia" },
  { value: "STRENGTH", label: "Força" },
  { value: "FAT_LOSS", label: "Queima" },
  { value: "ENDURANCE", label: "Resistência" },
];

function todayWeekIndex() {
  // 0=Seg ... 6=Dom
  const d = new Date().getDay(); // 0=Dom
  return (d + 6) % 7;
}

function Treinos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [confirmActive, setConfirmActive] = useState<WorkoutPlanResponse | null>(null);
  const [pendingCreate, setPendingCreate] = useState<{ name: string; goal: Goal } | null>(null);

  const plansQuery = useQuery({
    queryKey: ["plans", "treinos"],
    queryFn: () => PlansAPI.list({ page: 0, size: 20 }),
  });

  const plan = plansQuery.data?.content.find((p) => p.active) ?? plansQuery.data?.content[0];
  const activePlan = plansQuery.data?.content.find((p) => p.active);

  // Sort days locally for optimistic dnd
  const [days, setDays] = useState<WorkoutDay[]>([]);
  useEffect(() => {
    if (plan) setDays(plan.days.slice().sort((a, b) => a.dayOrder - b.dayOrder));
  }, [plan]);

  // Auto-expand today
  useEffect(() => {
    if (!expandedDay && days.length > 0) {
      const idx = todayWeekIndex();
      setExpandedDay(days[Math.min(idx, days.length - 1)].id);
    }
  }, [days, expandedDay]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const reorderDaysMut = useMutation({
    mutationFn: (orders: { dayId: string; order: number }[]) =>
      PlansAPI.reorderDays(plan!.id, orders),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const onDayDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !plan) return;
    const oldIdx = days.findIndex((d) => d.id === active.id);
    const newIdx = days.findIndex((d) => d.id === over.id);
    const next = arrayMove(days, oldIdx, newIdx);
    setDays(next);
    reorderDaysMut.mutate(next.map((d, i) => ({ dayId: d.id, order: i + 1 })));
  };

  const createMut = useMutation({
    mutationFn: (d: { name: string; goal: Goal }) => PlansAPI.create(d),
    onSuccess: (p) => {
      p.warnings?.forEach((w) => toast.warning(w));
      toast.success("Plano criado.");
      setCreating(false); setConfirmActive(null); setPendingCreate(null);
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestCreate = (d: { name: string; goal: Goal }) => {
    if (activePlan) { setPendingCreate(d); setConfirmActive(activePlan); }
    else createMut.mutate(d);
  };

  if (plansQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-fg-muted">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-caps text-fg-muted text-[10px]">MINHA FICHA</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">{plan?.name ?? "Sem plano"}</h1>
          <p className="text-[12px] text-fg-muted mt-1 truncate">
            {plan?.days.map((d) => d.name).slice(0, 4).join(" · ") || "Crie um plano para começar"}
          </p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="btn-press text-gold p-1" aria-label="Novo plano">
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

      {plan && days.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDayDragEnd}>
          <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-5 space-y-3">
              {days.map((d, i) => (
                <SortableDayCard
                  key={d.id}
                  day={d}
                  weekLabel={weekAbbr[i % 7]}
                  planId={plan.id}
                  expanded={expandedDay === d.id}
                  onToggle={() => setExpandedDay(expandedDay === d.id ? null : d.id)}
                  onStart={() => navigate({ to: "/dia", search: { pid: plan.id, did: d.id } })}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {plan && days.length === 0 && (
        <div className="mt-8 rounded-lg bg-card p-6 text-center border border-divider">
          <p className="text-sm text-fg-muted">Este plano ainda não tem dias.</p>
        </div>
      )}

      {!plan && !creating && (
        <div className="mt-10 rounded-lg bg-card p-6 text-center border border-divider">
          <p className="text-sm text-fg-muted">Você ainda não tem planos.</p>
          <button onClick={() => setCreating(true)}
            className="mt-4 rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]">
            CRIAR PRIMEIRO PLANO
          </button>
        </div>
      )}

      {confirmActive && pendingCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="rounded-lg p-6 max-w-[340px] w-full bg-card border border-gold/30">
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

function SortableDayCard({
  day, weekLabel, planId, expanded, onToggle, onStart,
}: {
  day: WorkoutDay; weekLabel: string; planId: string;
  expanded: boolean; onToggle: () => void; onStart: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const groups = useMemo(() => {
    const s = new Set<string>();
    day.exercises.forEach((e) => {
      const n = e.exerciseName.toLowerCase();
      if (n.includes("supino") || n.includes("crucifi")) s.add("Peito");
      else if (n.includes("desenvolv") || n.includes("elevaç")) s.add("Ombro");
      else if (n.includes("tríc") || n.includes("tric")) s.add("Tríceps");
      else if (n.includes("rem") || n.includes("puxa")) s.add("Costas");
      else if (n.includes("bíc") || n.includes("bic") || n.includes("rosca")) s.add("Bíceps");
      else if (n.includes("agachament") || n.includes("leg")) s.add("Quadríceps");
      else if (n.includes("stiff") || n.includes("posterior")) s.add("Posterior");
    });
    return Array.from(s).slice(0, 3).join(" · ") || "Musculação";
  }, [day.exercises]);

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, borderLeftWidth: expanded ? 2 : 0, borderLeftColor: "#C9A24B" }}
      className={`rounded-lg bg-card border border-divider overflow-hidden ${expanded ? "border-gold/40" : ""}`}
    >
      <div className="p-3 flex items-center gap-2">
        <button {...attributes} {...listeners} className="text-fg-muted touch-none cursor-grab active:cursor-grabbing p-1">
          <GripVertical size={16} />
        </button>
        <div className="w-8 text-center label-caps text-[10px] text-fg-muted">{weekLabel}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] truncate">{day.name}</div>
          <div className="text-[11px] text-fg-muted truncate">
            {groups} · {day.exercises.length} exercícios
          </div>
        </div>
        <button onClick={onStart}
          className="rounded-full bg-gold text-obsidian px-3 py-1.5 label-caps text-[10px] flex items-center gap-1 btn-press">
          <Play size={10} fill="currentColor" /> Iniciar
        </button>
        <button onClick={onToggle} className="btn-press text-fg-muted p-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <ExercisesList planId={planId} day={day} />
      )}
    </li>
  );
}

function ExercisesList({ planId, day }: { planId: string; day: WorkoutDay }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<WorkoutExercise[]>(
    day.exercises.slice().sort((a, b) => a.exerciseOrder - b.exerciseOrder),
  );
  useEffect(() => {
    setItems(day.exercises.slice().sort((a, b) => a.exerciseOrder - b.exerciseOrder));
  }, [day.exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const reorderMut = useMutation({
    mutationFn: (orders: { exerciseId: string; order: number }[]) =>
      PlansAPI.reorderExercises(planId, day.id, orders),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((x) => x.id === active.id);
    const newIdx = items.findIndex((x) => x.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    reorderMut.mutate(next.map((x, i) => ({ exerciseId: x.id, order: i + 1 })));
  };

  return (
    <div className="border-t border-divider bg-card-2/50">
      <div className="flex justify-end px-3 py-2">
        <button className="label-caps text-gold text-[10px] flex items-center gap-1 btn-press">
          <Pencil size={11} /> EDITAR
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <ul className="px-3 pb-3 space-y-2">
            {items.map((ex, i) => <SortableExerciseRow key={ex.id} ex={ex} order={i + 1} />)}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableExerciseRow({ ex, order }: { ex: WorkoutExercise; order: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <li ref={setNodeRef} style={style}
      className="rounded-lg bg-card border border-divider px-3 py-2.5 flex items-center gap-2">
      <button {...attributes} {...listeners} className="text-fg-muted touch-none cursor-grab active:cursor-grabbing">
        <span className="text-[11px] text-fg-muted/60 tabular-nums">{order}</span>
      </button>
      <div className="flex-1 min-w-0 pl-1">
        <div className="text-sm truncate">{ex.exerciseName}</div>
        <div className="text-[10px] text-fg-muted">Musculação</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-gold font-semibold text-[13px]">{ex.sets}×</div>
        <div className="text-[10px] text-fg-muted">{ex.reps}</div>
      </div>
    </li>
  );
}

function CreatePlanForm({ onSubmit, onCancel, busy }: {
  onSubmit: (d: { name: string; goal: Goal }) => void;
  onCancel: () => void; busy: boolean;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  return (
    <div className="mt-4 rounded-lg bg-card p-4 border border-gold/20">
      <p className="label-caps text-fg-muted text-[10px]">NOVO PLANO</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do plano"
        className="mt-2 w-full bg-transparent border border-gold/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {goals.map((g) => (
          <button key={g.value} onClick={() => setGoal(g.value)}
            className={`py-2 rounded-lg label-caps text-[10px] border ${goal === g.value ? "bg-gold text-obsidian border-gold" : "border-gold/20 text-fg-muted"}`}>
            {g.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-full border border-gold/30 py-2 label-caps text-[10px]">Cancelar</button>
        <button onClick={() => name && onSubmit({ name, goal })} disabled={!name || busy}
          className="flex-1 rounded-full bg-gold text-obsidian py-2 label-caps text-[10px] disabled:opacity-60">
          {busy ? "..." : "Criar"}
        </button>
      </div>
    </div>
  );
}
