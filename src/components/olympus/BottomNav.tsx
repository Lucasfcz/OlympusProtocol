import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, TrendingUp, User, Play, Dumbbell } from "lucide-react";

type Item = { to: "/home" | "/treinos" | "/evolucao" | "/perfil"; label: string; icon: typeof Home };

const left: Item[] = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/treinos", label: "Plano", icon: ClipboardList },
];
const right: Item[] = [
  { to: "/evolucao", label: "Evolução", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav({
  onStartPress,
  isActive = false,
}: {
  onStartPress: () => void;
  isActive?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="shrink-0 relative flex items-end justify-between px-2 pt-3 pb-4 bg-surface border-t border-divider"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      {left.map((it) => (
        <NavLink key={it.to} item={it} active={pathname === it.to} />
      ))}

      <div className="flex-1 flex flex-col items-center">
        <button
          onClick={onStartPress}
          aria-label={isActive ? "Retomar sessão" : "Iniciar sessão"}
          className={`btn-press -mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-gold ring-4 ring-surface ${
            isActive ? "bg-gold text-obsidian animate-pulse" : "bg-gold text-obsidian"
          }`}
        >
          {isActive ? <Dumbbell size={22} /> : <Play size={22} fill="currentColor" />}
        </button>
        <span className={`mt-1 text-[10px] tracking-wider ${isActive ? "text-gold font-medium" : "text-fg-muted"}`}>
          {isActive ? "Sessão ativa" : "Sessão"}
        </span>
      </div>

      {right.map((it) => (
        <NavLink key={it.to} item={it} active={pathname === it.to} />
      ))}
    </nav>
  );
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} className="flex-1 flex flex-col items-center gap-1 btn-press py-1">
      <Icon size={20} strokeWidth={1.6} className={active ? "text-gold" : "text-fg-muted"} />
      <span className={`text-[10px] tracking-wider ${active ? "text-gold font-medium" : "text-fg-muted"}`}>
        {item.label}
      </span>
    </Link>
  );
}
