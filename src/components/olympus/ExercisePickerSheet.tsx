import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { ExercisesAPI, type MuscleGroup } from "@/lib/api";

const GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: "CHEST", label: "Peito" },
  { value: "BACK", label: "Costas" },
  { value: "SHOULDERS", label: "Ombro" },
  { value: "BICEPS", label: "Bíceps" },
  { value: "TRICEPS", label: "Tríceps" },
  { value: "QUADRICEPS", label: "Quadríceps" },
  { value: "HAMSTRINGS", label: "Posterior" },
  { value: "GLUTES", label: "Glúteo" },
  { value: "CALVES", label: "Panturrilha" },
  { value: "ABS", label: "Abdômen" },
];

export function ExercisePickerSheet({
  open,
  onClose,
  onPick,
  title = "ADICIONAR EXERCÍCIO",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string, name: string) => void;
  title?: string;
  busy?: boolean;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [groups, setGroups] = useState<MuscleGroup[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const list = useQuery({
    queryKey: ["exercises", "picker", debounced, groups.join(",")],
    queryFn: () =>
      ExercisesAPI.list(
        { name: debounced || undefined, muscleGroups: groups.length ? groups : undefined },
        { page: 0, size: 30 },
      ),
    enabled: open,
  });

  if (!open) return null;

  const toggleGroup = (g: MuscleGroup) =>
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-[400px] max-h-[85vh] rounded-t-2xl sm:rounded-lg bg-card border border-gold/30 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-divider">
          <p className="label-caps text-gold text-[11px]">{title}</p>
          <button onClick={onClose} className="btn-press text-fg-muted"><X size={18} /></button>
        </div>

        <label className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-card-2 border border-divider px-3 py-2">
          <Search size={16} className="text-gold" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar exercício…"
            className="flex-1 bg-transparent focus:outline-none text-sm placeholder:text-fg-muted"
          />
        </label>

        <div className="mx-4 mt-3 flex flex-wrap gap-1.5">
          {GROUPS.map((g) => {
            const on = groups.includes(g.value);
            return (
              <button
                key={g.value}
                onClick={() => toggleGroup(g.value)}
                className={`label-caps text-[9px] rounded-full px-2.5 py-1 border ${
                  on ? "bg-gold text-obsidian border-gold" : "border-gold/25 text-fg-muted"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        <ul className="flex-1 overflow-y-auto olympus-scroll p-3 mt-2 space-y-1.5">
          {list.isLoading && (
            <li className="text-center py-4 text-fg-muted">
              <Loader2 className="animate-spin inline" size={16} />
            </li>
          )}
          {list.data?.content.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onPick(e.id, e.name)}
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
          {list.data && list.data.content.length === 0 && !list.isLoading && (
            <li className="text-center text-[12px] text-fg-muted py-4">Nenhum exercício encontrado.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
