import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, Award, Loader2 } from "lucide-react";
import { UsersAPI, type UserSummary } from "@/lib/api";
import { LoadMoreButton } from "@/components/olympus/LoadMoreButton";

export const Route = createFileRoute("/_tabs/social")({
  head: () => ({
    meta: [
      { title: "Social — Olympus Protocol" },
      { name: "description", content: "Encontre outros atletas da comunidade Olympus." },
    ],
  }),
  component: Social,
});

function initials(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const levelLabel: Record<string, string> = {
  BEGINNER: "INICIANTE", INTERMEDIATE: "INTERMEDIÁRIO",
  ADVANCED: "AVANÇADO", EXPERT: "EXPERT",
};

function Social() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<UserSummary[]>([]);

  // Reset acumulador quando query muda
  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [q]);

  const search = useQuery({
    queryKey: ["users", "search", q, page],
    queryFn: () => UsersAPI.search(q, { page, size: 20 }),
    enabled: q.length >= 2,
  });

  useEffect(() => {
    if (!search.data) return;
    setItems((prev) => page === 0 ? search.data!.content : [...prev, ...search.data!.content]);
  }, [search.data, page]);

  const hasMore = search.data ? !search.data.last : false;

  return (
    <div className="bg-surface text-fg anim-fade px-5 pt-6 pb-5">
      <header className="flex items-center justify-center">
        <p className="label-caps-lg text-[12px]">SOCIAL</p>
      </header>

      <label className="mt-6 flex items-center gap-2 card px-3 py-2.5">
        <Search size={16} className="text-gold" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar atleta pelo nome…"
          className="flex-1 bg-transparent focus:outline-none text-sm placeholder:text-fg-muted"
        />
      </label>

      <div className="mt-6">
        <p className="label-caps text-fg-muted text-[10px] mb-3">
          {q.length < 2
            ? "DIGITE PARA BUSCAR"
            : `RESULTADOS · ${search.data?.totalElements ?? items.length}`}
        </p>
        {search.isFetching && page === 0 && (
          <div className="flex justify-center py-4 text-fg-muted"><Loader2 className="animate-spin" size={20} /></div>
        )}
        <ul className="space-y-2.5">
          {items.map((u, i) => (
            <li key={u.id} className="card px-3 py-3 flex items-center gap-3">
              <span className={`w-6 text-center font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-silver" : i === 2 ? "text-bronze" : "text-fg-muted"}`}>
                {i + 1}
              </span>
              <div className="w-9 h-9 rounded-full bg-card-2 border border-gold/20 flex items-center justify-center text-[11px] text-gold">
                {initials(u.name)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{u.name}</div>
                <div className="text-[11px] text-fg-muted">{levelLabel[u.experienceLevel]}</div>
              </div>
              <Award size={18} className="text-gold/60" />
            </li>
          ))}
          {q.length >= 2 && !search.isFetching && items.length === 0 && (
            <li className="text-center text-sm text-fg-muted py-6">Nenhum atleta encontrado.</li>
          )}
        </ul>

        <LoadMoreButton
          hasMore={hasMore && q.length >= 2}
          loading={search.isFetching && page > 0}
          onClick={() => setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
