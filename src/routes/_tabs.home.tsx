import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Play, Dumbbell, Scale, Clock } from "lucide-react";
import { toast } from "sonner";
import { RingProgress } from "@/components/olympus/RingProgress";
import { useAuth } from "@/lib/auth";
import { PlansAPI, SessionsAPI, StatsAPI } from "@/lib/api";
import { useEffect } from "react";

export const Route = createFileRoute("/_tabs/home")({
  head: () => ({
    meta: [
      { title: "Início — Olympus Protocol" },
      { name: "description", content: "Painel diário do atleta: disciplina, próximo treino e resumo semanal." },
    ],
  }),
  component: Home,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "BOM DIA,";
  if (h < 18) return "BOA TARDE,";
  return "BOA NOITE,";
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = useQuery({ queryKey: ["stats", "me"], queryFn: StatsAPI.me });
  const weekly = useQuery({ queryKey: ["stats", "weekly"], queryFn: StatsAPI.weeklyVolume });
  const freq = useQuery({ queryKey: ["stats", "frequency"] , queryFn: StatsAPI.monthlyFrequency });
  const plans = useQuery({ queryKey: ["plans", 0], queryFn: () => PlansAPI.list({ page: 0 }) });
  const sessions = useQuery({ queryKey: ["sessions", 0], queryFn: () => SessionsAPI.list({ page: 0 }) });

  const activePlan = plans.data?.content.find((p) => p.active);
  const nextDay = activePlan?.days?.slice().sort((a, b) => a.dayOrder - b.dayOrder)[0];
  const activeSession = sessions.data?.content.find((s) => !s.finishedAt);

  useEffect(() => {
    plans.data?.content.forEach((p) => p.warnings?.forEach((w) => toast.warning(w)));
  }, [plans.data]);

  const discipline = Math.min(100, Math.round((freq.data?.avgSessionsPerWeek ?? 0) / 5 * 100));
  const weeklyVolume = weekly.data?.volumes?.reduce((a, b) => a + b.volume, 0) ?? 0;
  const weeklyMinutes = Math.round(((stats.data?.totalMinutesTrained ?? 0) % (60 * 24 * 7)));

  const startSession = async () => {
    if (activeSession) { navigate({ to: "/treino", search: { sid: activeSession.id } }); return; }
    if (!nextDay) { toast.info("Crie um plano de treino primeiro."); navigate({ to: "/treinos" }); return; }
    try {
      const s = await SessionsAPI.createFromPlan(nextDay.id);
      s.warnings?.forEach((w) => toast.warning(w));
      navigate({ to: "/treino", search: { sid: s.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível iniciar a sessão");
    }
  };

  return (
    <div className="bg-surface text-fg px-5 pt-6 pb-5 anim-fade">
      <header className="flex items-center justify-between">
        <div>
          <p className="label-caps text-fg-muted">{greeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {(user?.name ?? "ATLETA").split(" ")[0].toUpperCase()}
          </h1>
        </div>
        <button className="btn-press relative">
          <Bell size={20} strokeWidth={1.6} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>
      </header>

      <section className="card mt-6 p-5">
        <p className="label-caps text-fg-muted">DISCIPLINA</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="text-5xl font-bold tracking-tight">{discipline}<span className="text-gold">%</span></div>
            <p className="text-[12px] text-fg-muted mt-3 leading-snug max-w-[180px]">
              {freq.data
                ? `${freq.data.totalSessions} treinos nos últimos 30 dias · ${freq.data.avgSessionsPerWeek.toFixed(1)}/sem`
                : "Frequência recente do atleta."}
            </p>
          </div>
          <RingProgress value={discipline} size={96} stroke={6} />
        </div>
      </section>

      <section className="card mt-4 p-5">
        <p className="label-caps text-fg-muted">
          {activeSession ? "SESSÃO EM ANDAMENTO" : "PRÓXIMO TREINO"}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-xl font-semibold mt-1">
              {activeSession?.workoutDayName || nextDay?.name || (activePlan ? "Sem dias" : "Sem plano ativo")}
            </h2>
            <p className="text-xs text-fg-muted mt-1">
              {activePlan ? activePlan.name : "Crie um plano em Treinos"}
            </p>
          </div>
          <span className="text-gold/60">›</span>
        </div>
        <button
          onClick={startSession}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-gold text-obsidian py-3.5 label-caps-lg text-[12px] btn-press shadow-gold"
        >
          <Play size={14} fill="currentColor" /> {activeSession ? "CONTINUAR" : "INICIAR TREINO"}
        </button>
      </section>

      <section className="card mt-4 p-5">
        <p className="label-caps text-fg-muted">RESUMO</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBlock icon={<Dumbbell size={16} className="text-gold" strokeWidth={1.6} />}
            value={String(stats.data?.totalSessions ?? "—")} label="Treinos" />
          <div className="border-l border-divider" />
          <StatBlock icon={<Scale size={16} className="text-gold" strokeWidth={1.6} />}
            value={formatKg(weeklyVolume || stats.data?.totalVolumeAllTime || 0)} label="Volume" big />
        </div>
        <div className="mt-3 flex justify-end">
          <StatBlock icon={<Clock size={16} className="text-gold" strokeWidth={1.6} />}
            value={formatMin(stats.data?.totalMinutesTrained ?? weeklyMinutes)} label="Duração" />
        </div>
      </section>

      <div className="mt-4">
        <Link to="/treinos" className="block text-center label-caps text-gold text-[11px]">
          VER SEUS PLANOS →
        </Link>
      </div>
    </div>
  );
}

function formatKg(v: number) {
  if (v > 999_999) return `${(v / 1_000_000).toFixed(1)}M kg`;
  if (v > 999) return `${(v / 1000).toFixed(1)}k kg`;
  return `${Math.round(v)} kg`;
}
function formatMin(m: number) {
  const h = Math.floor(m / 60); const r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

function StatBlock({ icon, value, label, big = false }: { icon: React.ReactNode; value: string; label: string; big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className={`font-semibold ${big ? "text-[15px]" : "text-base"}`}>{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      </div>
    </div>
  );
}
