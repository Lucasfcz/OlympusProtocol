import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ColumnLogo } from "@/components/olympus/Icons";
import { useAuth } from "@/lib/auth";
import { ApiError, type ExperienceLevel } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Criar conta — Olympus Protocol" }] }),
  component: Register,
});

const levels: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Intermediário" },
  { value: "ADVANCED", label: "Avançado" },
  { value: "EXPERT", label: "Expert" },
];

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<ExperienceLevel>("BEGINNER");
  const [bodyWeight, setBodyWeight] = useState("");
  const [height, setHeight] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({
        name, email, password,
        experienceLevel: level,
        bodyWeight: bodyWeight ? Number(bodyWeight) : undefined,
        height: height ? Number(height) : undefined,
      });
      toast.success("Conta criada. Bem-vindo ao Olympus.");
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao criar conta");
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full w-full bg-obsidian text-snow anim-fade overflow-y-auto olympus-scroll">
      <div className="min-h-full px-8 py-8 flex flex-col items-center">
        <div className="text-gold mb-4"><ColumnLogo size={52} /></div>
        <h1 className="text-xl font-light tracking-[0.32em]">OLYMPUS</h1>
        <div className="gold-divider w-16 opacity-60 my-4" />
        <p className="label-caps text-muted-dark text-[10px] mb-6">CRIAR CONTA</p>

        <form onSubmit={submit} className="w-full max-w-[320px] space-y-3">
          <Field label="NOME" value={name} onChange={setName} required />
          <Field label="E-MAIL" type="email" value={email} onChange={setEmail} required />
          <Field label="SENHA" type="password" value={password} onChange={setPassword} required />

          <div>
            <span className="label-caps text-muted-dark text-[10px]">NÍVEL</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {levels.map((l) => (
                <button
                  key={l.value} type="button"
                  onClick={() => setLevel(l.value)}
                  className={`rounded-[8px] py-2.5 text-[11px] label-caps border transition-colors ${
                    level === l.value ? "bg-gold text-obsidian border-gold" : "border-gold/20 text-snow"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="PESO (KG)" type="number" value={bodyWeight} onChange={setBodyWeight} />
            <Field label="ALTURA (CM)" type="number" value={height} onChange={setHeight} />
          </div>

          <button
            type="submit" disabled={busy}
            className="w-full mt-4 rounded-full bg-gold text-obsidian py-3.5 label-caps-lg text-[12px] btn-press shadow-gold disabled:opacity-60"
          >
            {busy ? "CRIANDO..." : "CRIAR CONTA"}
          </button>
        </form>

        <p className="mt-6 text-xs text-muted-dark">
          Já tem conta?{" "}
          <Link to="/login" className="text-gold label-caps text-[10px]">ENTRAR</Link>
        </p>
      </div>
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
