import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/olympus/BottomNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_tabs")({
  component: TabsLayout,
});

function TabsLayout() {
  const { ready, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) navigate({ to: "/login" });
  }, [ready, isAuthenticated, navigate]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center text-fg-muted">
        <span className="label-caps text-[10px]">Carregando…</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 overflow-y-auto olympus-scroll pb-3">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
