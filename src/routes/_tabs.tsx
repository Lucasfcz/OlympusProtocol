import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/olympus/BottomNav";

export const Route = createFileRoute("/_tabs")({
  component: TabsLayout,
});

function TabsLayout() {
  return (
    <div className="min-h-screen pb-24">
      <Outlet />
      <BottomNav theme="dark" />
    </div>
  );
}
