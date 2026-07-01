import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ColumnLogo } from "@/components/olympus/Icons";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Olympus Protocol" }] }),
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Bem-vindo, atleta.");
      navigate({ to: "/home" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Falha no login";
      toast.error(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full w-full bg-obsidian text-snow anim-fade flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-gold mb-6"><ColumnLogo size={64} /></div>
        <h1 className="text-2xl font-light tracking-[0.32em]">OLYMPUS</h1>
        <p className="text-gold text-[10px] tracking-[0.55em] mt-1">P R O T O C O L</p>
        <div className="gold-divider w-16 opacity-60 mx-auto my-6" />

        <form onSubmit={submit} className="w-full max-w-[320px] space-y-3 text-left">
          <Field label="E-MAIL" value={email} onChange={setEmail} type="email" required />
          <Field label="SENHA" value={password} onChange={setPassword} type="password" required />
          <button
            type="submit" disabled={busy}
            className="w-full mt-2 rounded-full bg-gold text-obsidian py-3.5 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60"
          >
            {busy ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>

        <p className="mt-6 text-xs text-muted-dark">
          Ainda não é um atleta?{" "}
          <Link to="/register" className="text-gold label-caps text-[10px]">CRIAR CONTA</Link>
        </p>
      </div>
      <p className="pb-6 text-center label-caps text-muted-dark/60 text-[10px]">
        DISCIPLINA · EVOLUÇÃO · EXCELÊNCIA
      </p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-caps text-muted-dark text-[10px]">{label}</span>
      <input
        type={type} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-charcoal border border-gold/20 rounded-[8px] px-3 py-3 text-sm text-snow focus:outline-none focus:border-gold/60"
      />
    </label>
  );
}
