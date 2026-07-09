import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play, Plus, ChevronDown, ChevronUp, Loader2, GripVertical, Trash2, Pencil, ChevronRight, Flame,
} from "lucide-react";
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
import {
  PlansAPI, type Goal, type WorkoutDay, type WorkoutExercise, type WorkoutPlanResponse,
} from "@/lib/api";
import { ExercisePickerSheet } from "@/components/olympus/ExercisePickerSheet";
import { useActiveSession } from "@/lib/active-session";

export const Route = createFileRoute("/_tabs/treinos")({
  head: () => ({
    meta: [
      { title: "Plano — Olympus Protocol" },
      { name: "description", content: "Sua ficha de treinos: dias, exercícios e séries." },
    ],
  }),
  component: Treinos,
});

const goals: { value: Goal; label: string }[] = [
  { value: "HYPERTROPHY", label: "Hipertrofia" },
  { value: "STRENGTH", label: "Força" },
  { value: "FAT_LOSS", label: "Perda de peso" },
  { value: "RESISTENCE", label: "Resistência" },
];

const goalLabel = (g?: Goal) => goals.find((x) => x.value === g)?.label ?? "—";

function showWarnings(ws?: string[]) {
  ws?.forEach((w) => toast.warning(w));
}

function fieldErrorMessage(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "fieldErrors" in payload) {
    const fe = (payload as { fieldErrors?: { field?: string; message?: string }[] }).fieldErrors;
    if (fe?.length) return fe[0].message ?? null;
  }
  return null;
}

function Treinos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { refresh: refreshSession } = useActiveSession();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [addDayOpen, setAddDayOpen] = useState(false);

  const plansQuery = useQuery({
    queryKey: ["plans", "treinos"],
    queryFn: () => PlansAPI.list({ page: 0, size: 20 }),
  });

  const activePlan = plansQuery.data?.content.find((p) => p.active) ?? null;

  // Local ordered days for dnd
  const [days, setDays] = useState<WorkoutDay[]>([]);
  useEffect(() => {
    if (activePlan) setDays(activePlan.days.slice().sort((a, b) => a.dayOrder - b.dayOrder));
    else setDays([]);
  }, [activePlan]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const reorderDaysMut = useMutation({
    mutationFn: (orders: { dayId: string; order: number }[]) =>
      PlansAPI.reorderDays(activePlan!.id, orders),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const onDayDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !activePlan) return;
    const oldIdx = days.findIndex((d) => d.id === active.id);
    const newIdx = days.findIndex((d) => d.id === over.id);
    const next = arrayMove(days, oldIdx, newIdx);
    setDays(next);
    reorderDaysMut.mutate(next.map((d, i) => ({ dayId: d.id, order: i + 1 })));
  };

  const addDayMut = useMutation({
    mutationFn: (name: string) =>
      PlansAPI.addDay(activePlan!.id, { name, dayOrder: days.length + 1 }),
    onSuccess: (p) => {
      showWarnings(p.warnings);
      qc.invalidateQueries({ queryKey: ["plans"] });
      setAddDayOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMut = useMutation({
    mutationFn: () => PlansAPI.deactivate(activePlan!.id),
    onSuccess: () => {
      toast.success("Plano arquivado.");
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (plansQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-fg-muted">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  // ---------- Empty state (no active plan) ----------
  if (!activePlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 anim-fade">
        <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mb-6">
          <Flame size={32} className="text-gold" strokeWidth={1.5} />
        </div>
        <p className="label-caps text-fg-muted text-[10px]">SUA FICHA</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Você ainda não tem um plano ativo</h1>
        <p className="mt-2 text-sm text-fg-muted max-w-[280px]">
          Monte seu primeiro protocolo de treino e comece a acompanhar seu progresso.
        </p>
        <button
          onClick={() => setWizardOpen(true)}
          className="mt-8 w-full max-w-[280px] rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold flex items-center justify-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} /> CRIAR PLANO
        </button>

        {wizardOpen && (
          <CreatePlanWizard
            onClose={() => setWizardOpen(false)}
            onDone={() => {
              setWizardOpen(false);
              qc.invalidateQueries({ queryKey: ["plans"] });
            }}
          />
        )}
      </div>
    );
  }

  // ---------- Active plan editor ----------
  const dayCap = days.length >= 7;

  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-24">
      <header className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="label-caps text-fg-muted text-[10px]">MINHA FICHA</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1 truncate">{activePlan.name}</h1>
          <p className="text-[12px] text-gold mt-1">{goalLabel(activePlan.goal)}</p>
        </div>
        <button
          onClick={() => {
            if (confirm(`Arquivar "${activePlan.name}"?`)) deactivateMut.mutate();
          }}
          className="btn-press text-fg-muted p-1"
          aria-label="Arquivar plano"
          title="Arquivar plano"
        >
          <Trash2 size={18} strokeWidth={1.6} />
        </button>
      </header>

      {days.length === 0 ? (
        <div className="mt-8 rounded-lg bg-card p-6 text-center border border-divider">
          <p className="text-sm text-fg-muted">Este plano ainda não tem dias.</p>
          <button
            onClick={() => setAddDayOpen(true)}
            className="mt-4 rounded-full bg-gold text-obsidian px-4 py-2 label-caps text-[10px]"
          >
            Adicionar primeiro dia
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDayDragEnd}>
          <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-5 space-y-3">
              {days.map((d, i) => (
                <SortableDayCard
                  key={d.id}
                  day={d}
                  index={i}
                  planId={activePlan.id}
                  expanded={expandedDay === d.id}
                  onToggle={() => setExpandedDay(expandedDay === d.id ? null : d.id)}
                  onStart={() => {
                    refreshSession();
                    navigate({ to: "/dia", search: { pid: activePlan.id, did: d.id } });
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Add-day CTA */}
      <div className="mt-6">
        <button
          onClick={() => !dayCap && setAddDayOpen(true)}
          disabled={dayCap}
          title={dayCap ? "Limite de 7 dias por plano" : undefined}
          className="w-full rounded-lg border-2 border-dashed border-gold/40 py-4 label-caps text-gold text-[11px] flex items-center justify-center gap-2 btn-press disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> {dayCap ? "LIMITE DE 7 DIAS" : "ADICIONAR DIA"}
        </button>
      </div>

      {addDayOpen && (
        <AddDayDialog
          onClose={() => setAddDayOpen(false)}
          onSubmit={(name) => addDayMut.mutate(name)}
          busy={addDayMut.isPending}
        />
      )}
    </div>
  );
}

// ============================================================================
// Wizard: 2 etapas — dados do plano → primeiro dia
// ============================================================================

function CreatePlanWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  const [dayName, setDayName] = useState("");
  const [plan, setPlan] = useState<WorkoutPlanResponse | null>(null);

  const createPlan = useMutation({
    mutationFn: () => PlansAPI.create({ name, goal }),
    onSuccess: (p) => {
      showWarnings(p.warnings);
      setPlan(p);
      setStep(2);
    },
    onError: (e) => {
      const msg = (e as { payload?: unknown }).payload
        ? fieldErrorMessage((e as { payload?: unknown }).payload)
        : null;
      toast.error(msg ?? (e as Error).message);
    },
  });

  const addFirstDay = useMutation({
    mutationFn: () => PlansAPI.addDay(plan!.id, { name: dayName, dayOrder: 1 }),
    onSuccess: (p) => {
      showWarnings(p.warnings);
      toast.success("Plano criado!");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-stretch anim-fade">
      <div className="w-full h-full sm:m-auto sm:max-w-[420px] sm:max-h-[92vh] sm:rounded-lg bg-surface flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-divider">
          <p className="label-caps text-gold text-[11px]">NOVO PLANO · ETAPA {step}/2</p>
          <button onClick={onClose} className="btn-press text-fg-muted label-caps text-[10px]">FECHAR</button>
        </header>

        {step === 1 ? (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold">Como você chama esse plano?</h2>
            <p className="text-sm text-fg-muted mt-1">Ex: “Push · Pull · Legs”, “Base de verão”.</p>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do plano"
              className="mt-6 w-full bg-transparent border border-gold/30 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-gold"
            />

            <p className="label-caps text-fg-muted text-[10px] mt-6">OBJETIVO</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`py-3 rounded-lg label-caps text-[11px] border-2 ${
                    goal === g.value
                      ? "bg-gold text-obsidian border-gold"
                      : "border-gold/20 text-fg-muted"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => name.trim() && createPlan.mutate()}
              disabled={!name.trim() || createPlan.isPending}
              className="mt-8 w-full rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-50"
            >
              {createPlan.isPending ? "Criando..." : "CONTINUAR"}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold">Adicione o primeiro dia</h2>
            <p className="text-sm text-fg-muted mt-1">Um plano precisa ter pelo menos um dia. Você pode adicionar até 7.</p>

            <input
              autoFocus
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              placeholder='Nome do dia (ex: "Push")'
              className="mt-6 w-full bg-transparent border border-gold/30 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-gold"
            />

            <button
              onClick={() => dayName.trim() && addFirstDay.mutate()}
              disabled={!dayName.trim() || addFirstDay.isPending}
              className="mt-8 w-full rounded-lg bg-gold text-obsidian py-4 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-50"
            >
              {addFirstDay.isPending ? "Adicionando..." : "ADICIONAR DIA"}
            </button>

            <button
              onClick={onDone}
              className="mt-3 w-full label-caps text-fg-muted text-[10px] py-2"
            >
              Pular por enquanto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddDayDialog({
  onClose, onSubmit, busy,
}: { onClose: () => void; onSubmit: (name: string) => void; busy: boolean }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-[380px] rounded-t-2xl sm:rounded-lg bg-card border border-gold/30 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="label-caps text-gold text-[11px]">NOVO DIA</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Ex: "Push"'
          className="mt-4 w-full bg-transparent border border-gold/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-gold/30 py-2.5 label-caps text-[10px]">
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && onSubmit(name)}
            disabled={!name.trim() || busy}
            className="flex-1 rounded-full bg-gold text-obsidian py-2.5 label-caps text-[10px] disabled:opacity-50"
          >
            {busy ? "..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Day card + editor
// ============================================================================

function SortableDayCard({
  day, index, planId, expanded, onToggle, onStart,
}: {
  day: WorkoutDay; index: number; planId: string;
  expanded: boolean; onToggle: () => void; onStart: () => void;
}) {
  const qc = useQueryClient();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(day.name);
  useEffect(() => setName(day.name), [day.name]);

  const updateName = useMutation({
    mutationFn: () => PlansAPI.updateDay(planId, day.id, { name, dayOrder: day.dayOrder }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteDay = useMutation({
    mutationFn: () => PlansAPI.deleteDay(planId, day.id),
    onSuccess: () => {
      toast.success("Dia removido.");
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, borderLeftWidth: expanded ? 3 : 0, borderLeftColor: "#C9A24B" }}
      className={`rounded-lg bg-card border border-divider overflow-hidden ${expanded ? "border-gold/40" : ""}`}
    >
      <div className="p-3 flex items-center gap-2">
        <button {...attributes} {...listeners} className="text-fg-muted touch-none cursor-grab active:cursor-grabbing p-1">
          <GripVertical size={16} />
        </button>
        <div className="w-8 text-center label-caps text-[10px] text-fg-muted tabular-nums">D{index + 1}</div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name !== day.name ? updateName.mutate() : setEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && updateName.mutate()}
              className="w-full bg-transparent border-b border-gold/40 text-[15px] font-semibold focus:outline-none"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="text-left w-full">
              <div className="font-semibold text-[15px] truncate flex items-center gap-1.5">
                {day.name} <Pencil size={11} className="text-fg-muted/60" />
              </div>
              <div className="text-[11px] text-fg-muted truncate">
                {day.exercises.length} exercícios
              </div>
            </button>
          )}
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
        <div className="border-t border-divider bg-card-2/50">
          <ExercisesEditor planId={planId} day={day} />
          <div className="px-3 py-2 border-t border-divider flex justify-end">
            <button
              onClick={() => {
                if (confirm(`Excluir o dia "${day.name}"? Todos os exercícios serão removidos.`)) {
                  deleteDay.mutate();
                }
              }}
              className="label-caps text-[10px] text-fg-muted hover:text-red-400 btn-press flex items-center gap-1"
            >
              <Trash2 size={11} /> EXCLUIR DIA
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

// ============================================================================
// Exercises list within a day: reorder, add, edit, delete
// ============================================================================

function ExercisesEditor({ planId, day }: { planId: string; day: WorkoutDay }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<WorkoutExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingEx, setEditingEx] = useState<WorkoutExercise | null>(null);

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

  const addMut = useMutation({
    mutationFn: (exerciseId: string) =>
      PlansAPI.addExercise(planId, day.id, {
        exerciseId,
        exerciseOrder: items.length + 1,
        sets: 3, reps: 10, restTime: 60,
      }),
    onSuccess: (p) => {
      showWarnings(p.warnings);
      qc.invalidateQueries({ queryKey: ["plans"] });
      setPickerOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
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
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <ul className="px-3 pt-3 pb-2 space-y-2">
            {items.length === 0 && (
              <li className="text-center text-[12px] text-fg-muted py-3">Nenhum exercício ainda.</li>
            )}
            {items.map((ex, i) => (
              <SortableExerciseRow
                key={ex.id}
                ex={ex}
                order={i + 1}
                onEdit={() => setEditingEx(ex)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="px-3 pb-3">
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full rounded-lg border border-dashed border-gold/40 py-2.5 label-caps text-gold text-[10px] flex items-center justify-center gap-1 btn-press"
        >
          <Plus size={12} /> ADICIONAR EXERCÍCIO
        </button>
      </div>

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => addMut.mutate(id)}
        busy={addMut.isPending}
      />

      {editingEx && (
        <EditExerciseDialog
          planId={planId}
          dayId={day.id}
          ex={editingEx}
          onClose={() => setEditingEx(null)}
        />
      )}
    </div>
  );
}

function SortableExerciseRow({
  ex, order, onEdit,
}: {
  ex: WorkoutExercise; order: number; onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <li ref={setNodeRef} style={style}
      className="rounded-lg bg-card border border-divider px-3 py-2.5 flex items-center gap-2">
      <button {...attributes} {...listeners} className="text-fg-muted touch-none cursor-grab active:cursor-grabbing">
        <GripVertical size={14} />
      </button>
      <span className="text-[11px] text-fg-muted/60 tabular-nums w-4">{order}</span>
      <button onClick={onEdit} className="flex-1 min-w-0 text-left flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{ex.exerciseName}</div>
          <div className="text-[10px] text-fg-muted">
            {ex.sets}× · {ex.reps} reps · {ex.restTime}s
          </div>
        </div>
        <ChevronRight size={14} className="text-fg-muted shrink-0" />
      </button>
    </li>
  );
}

function EditExerciseDialog({
  planId, dayId, ex, onClose,
}: { planId: string; dayId: string; ex: WorkoutExercise; onClose: () => void }) {
  const qc = useQueryClient();
  const [sets, setSets] = useState(ex.sets);
  const [reps, setReps] = useState(ex.reps);
  const [rest, setRest] = useState(ex.restTime);

  const update = useMutation({
    mutationFn: () =>
      PlansAPI.updateExercise(planId, dayId, ex.id, {
        exerciseId: ex.exerciseId,
        exerciseOrder: ex.exerciseOrder,
        sets, reps, restTime: rest,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => PlansAPI.deleteExercise(planId, dayId, ex.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-[380px] rounded-t-2xl sm:rounded-lg bg-card border border-gold/30 p-5"
        onClick={(e) => e.stopPropagation()}>
        <p className="label-caps text-gold text-[11px]">EDITAR EXERCÍCIO</p>
        <h3 className="mt-1 text-lg font-semibold truncate">{ex.exerciseName}</h3>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <NumField label="SÉRIES" value={sets} onChange={setSets} min={1} />
          <NumField label="REPS" value={reps} onChange={setReps} min={1} />
          <NumField label="DESC. (s)" value={rest} onChange={setRest} min={0} step={15} />
        </div>

        <button
          onClick={() => update.mutate()}
          disabled={update.isPending}
          className="mt-5 w-full rounded-lg bg-gold text-obsidian py-3 label-caps text-[11px] btn-press shadow-gold disabled:opacity-50"
        >
          {update.isPending ? "..." : "SALVAR"}
        </button>
        <button
          onClick={() => {
            if (confirm(`Remover ${ex.exerciseName} deste dia?`)) del.mutate();
          }}
          className="mt-2 w-full py-2.5 label-caps text-[10px] text-red-400/80 hover:text-red-400 flex items-center justify-center gap-1"
        >
          <Trash2 size={12} /> REMOVER
        </button>
      </div>
    </div>
  );
}

function NumField({
  label, value, onChange, min = 0, step = 1,
}: { label: string; value: number; onChange: (n: number) => void; min?: number; step?: number }) {
  return (
    <div className="rounded-lg bg-card-2 border border-divider p-2 text-center">
      <p className="label-caps text-fg-muted text-[9px]">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-1">
        <button onClick={() => onChange(Math.max(min, value - step))}
          className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">−</button>
        <span className="text-lg font-bold tabular-nums w-8">{value}</span>
        <button onClick={() => onChange(value + step)}
          className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">+</button>
      </div>
    </div>
  );
}

// Unused legacy export kept for compat with old imports
export const _u = useMemo;
