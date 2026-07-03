import { Loader2 } from "lucide-react";

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  hasMore: boolean;
  label?: string;
};

export function LoadMoreButton({ onClick, loading, disabled, hasMore, label = "CARREGAR MAIS" }: Props) {
  if (!hasMore) return null;
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="rounded-full border border-gold/40 bg-card px-5 py-2.5 label-caps text-[10px] text-gold btn-press disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <Loader2 size={12} className="animate-spin" />}
        {label}
      </button>
    </div>
  );
}
