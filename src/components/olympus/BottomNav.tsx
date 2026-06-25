import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Dumbbell, BarChart3, Users, User } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
  { to: "/evolucao", label: "Evolução", icon: BarChart3 },
  { to: "/social", label: "Social", icon: Users },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDark = theme === "dark";
  return (
    <nav
      className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pt-3 pb-5 ${
        isDark ? "bg-obsidian border-t border-gold/15" : "bg-white border-t border-ink/10"
      }`}
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || (to === "/home" && pathname === "/home");
        return (
          <Link
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-1 btn-press"
          >
            <Icon
              size={20}
              strokeWidth={1.6}
              className={
                active
                  ? "text-gold"
                  : isDark
                  ? "text-muted-dark"
                  : "text-muted-light"
              }
            />
            <span
              className={`text-[10px] tracking-wider ${
                active ? "text-gold font-medium" : isDark ? "text-muted-dark" : "text-muted-light"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
