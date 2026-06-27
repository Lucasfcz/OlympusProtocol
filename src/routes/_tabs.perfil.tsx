import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Bell, Shield, LogOut, ChevronRight, Sun, Moon } from "lucide-react";
import { Laurel } from "@/components/olympus/Icons";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_tabs/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Olympus Protocol" },
      { name: "description", content: "Seu perfil, nível e configurações." },
    ],
  }),
  component: Perfil,
});

const stats = [
  { label: "TREINOS", value: "284" },
  { label: "VOLUME TOTAL", value: "1.2M kg" },
  { label: "SEQUÊNCIA", value: "47 dias" },
];

const settings = [
  { label: "Notificações", icon: Bell },
  { label: "Privacidade", icon: Shield },
  { label: "Preferências", icon: Settings },
  { label: "Sair", icon: LogOut },
];

function Perfil() {
  const { theme, toggle } = useTheme();
  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-5">
      <header className="flex items-center justify-between">
        <span className="w-6" />
        <p className="label-caps-lg text-[12px]">PERFIL</p>
        <button onClick={toggle} className="btn-press" aria-label="Alternar tema">
          {theme === "dark" ? <Sun size={20} strokeWidth={1.6} /> : <Moon size={20} strokeWidth={1.6} />}
        </button>
      </header>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-card border border-gold/30 flex items-center justify-center text-2xl text-gold font-semibold">
            AT
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface border border-gold flex items-center justify-center text-gold">
            <Laurel size={16} />
          </div>
        </div>
        <h1 className="mt-4 text-xl font-bold">Atleta Olímpico</h1>
        <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="label-caps text-gold text-[10px]">NÍVEL — PRÆTOR</span>
        </div>
      </div>

      <section className="mt-7 card p-5">
        <div className="grid grid-cols-3 divide-x divide-divider">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-2">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] tracking-widest text-fg-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Link to="/conquistas" className="mt-4 card p-4 flex items-center justify-between btn-press">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold">
            <Laurel size={18} />
          </div>
          <div>
            <div className="text-sm font-medium">Conquistas</div>
            <div className="text-[11px] text-fg-muted">3 de 18 desbloqueadas</div>
          </div>
        </div>
        <ChevronRight size={18} className="text-fg-muted" />
      </Link>

      <button
        onClick={toggle}
        className="mt-4 w-full card p-4 flex items-center justify-between btn-press"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Tema</div>
            <div className="text-[11px] text-fg-muted capitalize">{theme === "dark" ? "Escuro" : "Claro"}</div>
          </div>
        </div>
        <span className="label-caps text-gold text-[10px]">TROCAR</span>
      </button>

      <ul className="mt-4 card divide-y divide-divider">
        {settings.map(({ label, icon: Icon }) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3.5 btn-press">
            <Icon size={18} className="text-gold" strokeWidth={1.6} />
            <span className="flex-1 text-sm">{label}</span>
            <ChevronRight size={16} className="text-fg-muted" />
          </li>
        ))}
      </ul>

      <p className="mt-8 mb-2 text-center label-caps text-fg-muted/60 text-[10px]">
        DISCIPLINA &middot; EVOLUÇÃO &middot; EXCELÊNCIA
      </p>
    </div>
  );
}
