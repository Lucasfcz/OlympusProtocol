import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Dumbbell, BarChart3, Users, User } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
  { to: "/evolucao", label: "Evolução", icon: BarChart3 },
  { to: "/social", label: "Social", icon: Users },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="shrink-0 flex items-center justify-between px-3 pt-3 pb-5 bg-surface border-t border-divider"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link key={to} to={to} className="flex-1 flex flex-col items-center gap-1 btn-press">
            <Icon
              size={20}
              strokeWidth={1.6}
              className={active ? "text-gold" : "text-fg-muted"}
            />
            <span className={`text-[10px] tracking-wider ${active ? "text-gold font-medium" : "text-fg-muted"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
