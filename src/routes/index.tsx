import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ColumnLogo } from "@/components/olympus/Icons";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/home" }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative h-full w-full bg-obsidian overflow-hidden flex flex-col items-center justify-center anim-fade">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,164,106,0.10),transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.04),transparent_70%)]" />
      <svg viewBox="0 0 390 220" className="absolute bottom-0 left-0 right-0 opacity-40" preserveAspectRatio="none">
        <path d="M0 220 L 60 140 L 110 170 L 170 90 L 230 150 L 290 100 L 340 160 L 390 130 L 390 220 Z" fill="#0d0d0d" stroke="#1c1c1c"/>
      </svg>

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
        <Link to="/home" className="mt-8 label-caps text-muted-dark hover:text-gold transition-colors">
          Entrar
        </Link>
      </div>
    </div>
  );
}
