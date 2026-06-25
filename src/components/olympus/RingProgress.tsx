import { Laurel } from "./Icons";

export function RingProgress({
  value,
  size = 84,
  stroke = 6,
}: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(201,162,75,0.15)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#C9A24B"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          className="anim-ring"
          style={{
            // CSS vars for keyframes
            ["--ring-circ" as string]: `${c}`,
            ["--ring-offset" as string]: `${offset}`,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-gold">
        <Laurel size={28} />
      </div>
    </div>
  );
}
