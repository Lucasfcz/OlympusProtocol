import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/olympus/BottomNav";

export const Route = createFileRoute("/_tabs")({
  component: TabsLayout,
});

function TabsLayout() {
  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 overflow-y-auto olympus-scroll pb-3">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
