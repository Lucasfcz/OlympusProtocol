import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ColumnLogo } from "@/components/olympus/Icons";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      navigate({ to: isAuthenticated ? "/home" : "/login" });
    }, 1200);
    return () => clearTimeout(t);
  }, [ready, isAuthenticated, navigate]);

  return (
    <div className="relative h-full w-full bg-obsidian overflow-hidden flex flex-col items-center justify-center anim-fade">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,164,106,0.10),transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <div className="text-gold animate-[badge-pulse_2400ms_ease-in-out_infinite]">
          <ColumnLogo size={88} />
        </div>
        <div>
          <h1 className="text-snow text-3xl font-light tracking-[0.32em]">OLYMPUS</h1>
          <p className="text-gold text-xs tracking-[0.55em] mt-2">P R O T O C O L</p>
        </div>
        <div className="gold-divider w-24 opacity-60" />
        <p className="label-caps text-muted-dark">
          DISCIPLINA &middot; EVOLUÇÃO &middot; EXCELÊNCIA
        </p>
      </div>
    </div>
  );
}
