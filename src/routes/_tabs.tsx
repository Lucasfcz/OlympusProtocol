import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/olympus/BottomNav";
import { StartSessionModal } from "@/components/olympus/StartSessionModal";
import { useAuth } from "@/lib/auth";
import { ActiveSessionProvider, useActiveSession } from "@/lib/active-session";

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
    <ActiveSessionProvider>
      <TabsShell />
    </ActiveSessionProvider>
  );
}

function TabsShell() {
  const [startOpen, setStartOpen] = useState(false);
  const navigate = useNavigate();
  const { session, isActive, refresh } = useActiveSession();

  const onStartPress = () => {
    if (isActive && session) {
      navigate({ to: "/treino", search: { sid: session.id } });
    } else {
      setStartOpen(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 overflow-y-auto olympus-scroll pb-3">
        <Outlet />
      </main>
      <BottomNav onStartPress={onStartPress} isActive={isActive} />
      <StartSessionModal open={startOpen} onClose={() => setStartOpen(false)} onStarted={refresh} />
    </div>
  );
}
