import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Check, Sun, Moon, LogOut, Bell, Shield, Settings, Archive, Download, X, Share, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { PlansAPI, StatsAPI, type WorkoutPlanResponse } from "@/lib/api";
import { usePwaInstall } from "@/lib/pwa-install";

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
  const { installPromptAvailable, isInstalled, platform, promptInstall } = usePwaInstall();
  const [installOpen, setInstallOpen] = useState(false);
  const [installTab, setInstallTab] = useState<"android" | "ios">("android");
  const [installStatus, setInstallStatus] = useState<"idle" | "prompting" | "accepted" | "dismissed" | "unavailable">("idle");
  const stats = useQuery({ queryKey: ["stats", "me"], queryFn: StatsAPI.me });
  const plans = useQuery({ queryKey: ["plans", "perfil"], queryFn: () => PlansAPI.list({ page: 0, size: 20 }) });

  const list = plans.data?.content ?? [];
  const active = list.find((p) => p.active);
  const previous = list.filter((p) => !p.active);

  const openInstallModal = () => {
    if (isInstalled) return;
    setInstallStatus("idle");
    setInstallTab(platform === "ios" ? "ios" : "android");
    setInstallOpen(true);
  };

  const handlePromptInstall = async () => {
    if (!installPromptAvailable) return;
    setInstallStatus("prompting");
    const outcome = await promptInstall();
    setInstallStatus(outcome);
    if (outcome === "accepted") toast.success("Instalação iniciada.");
  };

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
        <PlanCard plan={active} isActive />
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
        {!isInstalled && (
          <li onClick={openInstallModal} className="flex items-center gap-3 px-4 py-3.5 btn-press cursor-pointer">
            <Download size={18} className="text-gold" strokeWidth={1.6} />
            <span className="flex-1 text-sm">Baixar app</span>
            <ChevronRight size={16} className="text-fg-muted" />
          </li>
        )}
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

      {installOpen && !isInstalled && (
        <InstallAppModal
          activeTab={installTab}
          installPromptAvailable={installPromptAvailable}
          installStatus={installStatus}
          onClose={() => setInstallOpen(false)}
          onPromptInstall={handlePromptInstall}
          onTabChange={(tab) => {
            setInstallStatus("idle");
            setInstallTab(tab);
          }}
        />
      )}
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

function PlanCard({ plan, isActive = false }: { plan: WorkoutPlanResponse; isActive?: boolean }) {
  const qc = useQueryClient();
  const archive = useMutation({
    mutationFn: () => PlansAPI.deactivate(plan.id),
    onSuccess: () => {
      toast.success("Plano arquivado.");
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-2 rounded-lg bg-card p-4 border-2" style={{ borderColor: isActive ? "#C9A24B" : "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isActive && <Check size={12} className="text-gold" strokeWidth={3} />}
          <span className="label-caps text-gold text-[10px]">{isActive ? "ATIVO" : "ARQUIVADO"}</span>
        </div>
        <span className="label-caps text-fg-muted text-[10px]">{fmtMonth(plan.createdAt)}</span>
      </div>
      <h2 className="mt-2 text-xl font-bold truncate">{plan.name}</h2>
      <p className="text-[11px] text-fg-muted mt-0.5 truncate">
        {plan.days.map((d) => d.name).join(" · ") || "—"}
      </p>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-fg-muted">
        <span>{plan.days.length}d/sem</span>
        <span>·</span>
        <span>{plan.days.reduce((a, d) => a + d.exercises.length, 0)} exercícios</span>
      </div>
      {isActive && (
        <button
          onClick={() => confirm(`Arquivar "${plan.name}"?`) && archive.mutate()}
          disabled={archive.isPending}
          className="mt-3 label-caps text-[10px] text-fg-muted hover:text-gold flex items-center gap-1 btn-press disabled:opacity-50"
        >
          <Archive size={11} /> ARQUIVAR
        </button>
      )}
    </div>
  );
}

function PreviousPlan({ plan }: { plan: WorkoutPlanResponse }) {
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

function InstallAppModal({
  activeTab,
  installPromptAvailable,
  installStatus,
  onClose,
  onPromptInstall,
  onTabChange,
}: {
  activeTab: "android" | "ios";
  installPromptAvailable: boolean;
  installStatus: "idle" | "prompting" | "accepted" | "dismissed" | "unavailable";
  onClose: () => void;
  onPromptInstall: () => void;
  onTabChange: (tab: "android" | "ios") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-obsidian/80 px-4 pb-4 pt-10 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="w-full max-w-[420px] rounded-lg border border-divider bg-surface shadow-gold">
        <div className="flex items-start justify-between gap-4 border-b border-divider px-5 py-4">
          <div>
            <p className="label-caps text-gold text-[10px]">OLYMPUS PROTOCOL</p>
            <h2 id="install-title" className="mt-1 text-xl font-bold">Baixar app</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="btn-press rounded-full border border-divider p-2 text-fg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-card-2 p-1">
            <button
              onClick={() => onTabChange("android")}
              className={`rounded-md px-3 py-2 text-sm font-semibold btn-press ${activeTab === "android" ? "bg-gold text-obsidian" : "text-fg-muted"}`}
            >
              Android
            </button>
            <button
              onClick={() => onTabChange("ios")}
              className={`rounded-md px-3 py-2 text-sm font-semibold btn-press ${activeTab === "ios" ? "bg-gold text-obsidian" : "text-fg-muted"}`}
            >
              iPhone
            </button>
          </div>

          {activeTab === "android" ? (
            <AndroidInstallPanel
              installPromptAvailable={installPromptAvailable}
              installStatus={installStatus}
              onPromptInstall={onPromptInstall}
            />
          ) : (
            <IphoneInstallPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function AndroidInstallPanel({
  installPromptAvailable,
  installStatus,
  onPromptInstall,
}: {
  installPromptAvailable: boolean;
  installStatus: "idle" | "prompting" | "accepted" | "dismissed" | "unavailable";
  onPromptInstall: () => void;
}) {
  const unavailable = !installPromptAvailable || installStatus === "dismissed" || installStatus === "unavailable";

  return (
    <div className="pt-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-card text-gold">
          <Smartphone size={20} />
        </div>
        <div>
          <h3 className="font-semibold">Android</h3>
          <p className="text-[12px] text-fg-muted">Instale o Olympus na tela inicial.</p>
        </div>
      </div>

      {installPromptAvailable && installStatus !== "dismissed" && installStatus !== "unavailable" ? (
        <button
          onClick={onPromptInstall}
          disabled={installStatus === "prompting"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 label-caps text-obsidian btn-press disabled:opacity-60"
        >
          <Download size={16} />
          {installStatus === "prompting" ? "Abrindo..." : "Baixar aqui"}
        </button>
      ) : null}

      {unavailable && (
        <div className="mt-5 rounded-lg border border-divider bg-card p-4 text-sm text-fg-muted">
          <p className="font-medium text-fg">Instalação não disponível neste navegador.</p>
          <p className="mt-2 text-[12px] leading-5">Use o menu do navegador: ⋮ → Adicionar à tela inicial.</p>
        </div>
      )}
    </div>
  );
}

function IphoneInstallPanel() {
  return (
    <div className="space-y-3 pt-5">
      <InstallStep icon={<SafariShareIcon />} text="Toque no ícone de Compartilhar (□ com seta pra cima) na barra do Safari." />
      <InstallStep icon={<Share size={18} />} text="Role e toque em ‘Adicionar à Tela de Início’." />
      <InstallStep icon={<Plus size={18} />} text="Toque em ‘Adicionar’." />
    </div>
  );
}

function InstallStep({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-divider bg-card p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card-2 text-gold">
        {icon}
      </div>
      <p className="text-sm leading-5 text-fg-muted">{text}</p>
    </div>
  );
}

function SafariShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.25 6.75 12 3l3.75 3.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10H5.8A1.8 1.8 0 0 0 4 11.8v7.4A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.8-1.8v-7.4a1.8 1.8 0 0 0-1.8-1.8H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

