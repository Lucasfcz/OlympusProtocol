import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Check, Sun, Moon, LogOut, Bell, Shield, Settings, Archive } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { PlansAPI, StatsAPI, type WorkoutPlanResponse } from "@/lib/api";

export const Route = createFileRoute("/_tabs/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Olympus Protocol" },
      { name: "description", content: "Sua conta, plano ativo e fichas anteriores." },
    ],
  }),
  component: Perfil,
});

const levelLabel: Record<string, string> = {
  BEGINNER: "INICIANTE", INTERMEDIATE: "INTERMEDIÁRIO",
  ADVANCED: "AVANÇADO", EXPERT: "EXPERT",
};

function initials(n?: string) {
  if (!n) return "AT";
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function fmtMonth(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "").toUpperCase();
}

function fmtVolume(v: number) {
  if (v > 999_999) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v > 999) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function fmtHours(min: number) {
  const h = Math.floor(min / 60);
  const r = min % 60;
  return `${h}:${String(r).padStart(2, "0")}`;
}

function Perfil() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const stats = useQuery({ queryKey: ["stats", "me"], queryFn: StatsAPI.me });
  const plans = useQuery({ queryKey: ["plans", "perfil"], queryFn: () => PlansAPI.list({ page: 0, size: 20 }) });

  const list = plans.data?.content ?? [];
  const active = list.find((p) => p.active);
  const previous = list.filter((p) => !p.active);

  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-6">
      <p className="label-caps text-fg-muted text-[11px]">SUA CONTA</p>
      <h1 className="text-3xl font-bold tracking-tight mt-1">Perfil</h1>

      {/* Cartão do usuário com borda dourada */}
      <button className="mt-5 w-full rounded-lg border-2 bg-card p-4 flex items-center gap-3 btn-press text-left"
        style={{ borderColor: "#C9A24B" }}>
        <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-semibold text-gold"
          style={{ borderColor: "#C9A24B" }}>
          {initials(user?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{user?.name ?? "Atleta"}</div>
          <div className="label-caps text-gold text-[10px] mt-0.5">
            {levelLabel[user?.experienceLevel ?? "BEGINNER"]}
          </div>
          <div className="text-[11px] text-fg-muted mt-0.5">
            {user?.bodyWeight ? `${user.bodyWeight} kg` : "— kg"} · {user?.height ? `${user.height} cm` : "— cm"}
          </div>
        </div>
        <ChevronRight size={18} className="text-gold" />
      </button>

      {/* Estatísticas */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatBox value={String(stats.data?.totalSessions ?? "—")} label="TREINOS" />
        <StatBox value={fmtVolume(stats.data?.totalVolumeAllTime ?? 0) + "k"} label="VOLUME"
          rawValue={stats.data ? fmtVolume(stats.data.totalVolumeAllTime) : "—"} />
        <StatBox value={fmtHours(stats.data?.totalMinutesTrained ?? 0)} label="HORAS" />
      </div>

      {/* Treino ativo */}
      <p className="label-caps text-fg-muted text-[10px] mt-6">TREINO ATIVO</p>
      {active ? (
        <div className="mt-2 rounded-lg bg-card p-4 border-2" style={{ borderColor: "#C9A24B" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Check size={12} className="text-gold" strokeWidth={3} />
              <span className="label-caps text-gold text-[10px]">ATIVO</span>
            </div>
            <span className="label-caps text-fg-muted text-[10px]">{fmtMonth(active.createdAt)}</span>
          </div>
          <h2 className="mt-2 text-xl font-bold">{active.name}</h2>
          <p className="text-[11px] text-fg-muted mt-0.5 truncate">
            {active.days.map((d) => d.name).join(" · ") || "—"}
          </p>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-fg-muted">
            <span>{Math.max(1, Math.round(active.days.length * 1.3))} semanas</span>
            <span>·</span>
            <span>{active.days.length}d/sem</span>
            <span>·</span>
            <span>{active.days.reduce((a, d) => a + d.exercises.length, 0)} exercícios</span>
          </div>
        </div>
      ) : (
        <div className="mt-2 rounded-lg bg-card p-4 text-center text-[12px] text-fg-muted border border-divider">
          Sem plano ativo no momento.
        </div>
      )}

      {/* Fichas anteriores */}
      {previous.length > 0 && (
        <>
          <p className="label-caps text-fg-muted text-[10px] mt-6">FICHAS ANTERIORES</p>
          <ul className="mt-2 space-y-2">
            {previous.map((p) => <PreviousPlan key={p.id} plan={p} />)}
          </ul>
        </>
      )}

      {/* Ações menores */}
      <ul className="mt-6 card divide-y divide-divider rounded-lg overflow-hidden">
        <li onClick={toggle} className="flex items-center gap-3 px-4 py-3.5 btn-press cursor-pointer">
          {theme === "dark" ? <Sun size={18} className="text-gold" /> : <Moon size={18} className="text-gold" />}
          <span className="flex-1 text-sm">Tema</span>
          <span className="text-[11px] text-fg-muted capitalize">{theme === "dark" ? "Escuro" : "Claro"}</span>
        </li>
        {[
          { label: "Notificações", icon: Bell },
          { label: "Privacidade", icon: Shield },
          { label: "Preferências", icon: Settings },
        ].map(({ label, icon: Icon }) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3.5 btn-press cursor-pointer">
            <Icon size={18} className="text-gold" strokeWidth={1.6} />
            <span className="flex-1 text-sm">{label}</span>
            <ChevronRight size={16} className="text-fg-muted" />
          </li>
        ))}
        <li onClick={logout} className="flex items-center gap-3 px-4 py-3.5 btn-press cursor-pointer">
          <LogOut size={18} className="text-gold" strokeWidth={1.6} />
          <span className="flex-1 text-sm">Sair</span>
          <ChevronRight size={16} className="text-fg-muted" />
        </li>
      </ul>

      <p className="mt-6 text-center label-caps text-fg-muted/60 text-[10px]">
        OLYMPUS PROTOCOL · V1.0
      </p>
    </div>
  );
}

function StatBox({ value, label, rawValue }: { value: string; label: string; rawValue?: string }) {
  return (
    <div className="rounded-lg bg-card p-3 text-center border border-divider">
      <div className="text-xl font-bold">{rawValue ?? value}</div>
      <div className="label-caps text-fg-muted text-[9px] mt-1">{label}</div>
    </div>
  );
}

function PreviousPlan({ plan }: { plan: WorkoutPlanResponse }) {
  const groups = new Set<string>();
  plan.days.forEach((d) => d.exercises.forEach(() => groups.add(d.name)));
  const label = plan.days.map((d) => d.name).slice(0, 2).join(" · ");
  return (
    <li className="rounded-lg bg-card p-3 flex items-center gap-3 border border-divider">
      <div className="w-9 h-9 rounded-full bg-card-2 border border-gold/30 flex items-center justify-center text-[10px] text-gold font-semibold">
        {plan.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{plan.name}</div>
        <div className="text-[11px] text-fg-muted truncate">{label || "—"}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="label-caps text-fg-muted text-[9px]">{fmtMonth(plan.createdAt)}</div>
        <div className="text-[11px] text-fg-muted mt-0.5">{plan.days.length}d</div>
      </div>
    </li>
  );
}
