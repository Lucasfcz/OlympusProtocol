import type { SVGProps } from "react";

export function ColumnLogo({ size = 56, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" {...p}>
      <path d="M8 14 L32 4 L56 14 L56 18 L8 18 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
      <rect x="10" y="20" width="44" height="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="25" width="5" height="26" stroke="currentColor" strokeWidth="2"/>
      <rect x="22.5" y="25" width="5" height="26" stroke="currentColor" strokeWidth="2"/>
      <rect x="31" y="25" width="5" height="26" stroke="currentColor" strokeWidth="2"/>
      <rect x="39.5" y="25" width="5" height="26" stroke="currentColor" strokeWidth="2"/>
      <rect x="48" y="25" width="2" height="26" stroke="currentColor" strokeWidth="2"/>
      <rect x="8" y="53" width="48" height="4" stroke="currentColor" strokeWidth="2"/>
      <rect x="6" y="58" width="52" height="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function Laurel({ size = 32, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" {...p}>
      <path d="M32 56 C 20 56 12 44 12 30 C 12 22 16 16 20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 56 C 44 56 52 44 52 30 C 52 22 48 16 44 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {[0,1,2,3,4].map(i => (
        <g key={`l-${i}`} transform={`translate(${14 + i*2} ${22 + i*6}) rotate(-40)`}>
          <ellipse cx="0" cy="0" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.4"/>
        </g>
      ))}
      {[0,1,2,3,4].map(i => (
        <g key={`r-${i}`} transform={`translate(${50 - i*2} ${22 + i*6}) rotate(40)`}>
          <ellipse cx="0" cy="0" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.4"/>
        </g>
      ))}
      <circle cx="32" cy="56" r="2" fill="currentColor"/>
    </svg>
  );
}

export function ColumnSmall({ size = 22, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" {...p}>
      <path d="M3 9 L16 4 L29 9 L29 11 L3 11 Z" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="7" y1="13" x2="7" y2="26" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="12" y1="13" x2="12" y2="26" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="16" y1="13" x2="16" y2="26" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="20" y1="13" x2="20" y2="26" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="25" y1="13" x2="25" y2="26" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="3" y="26" width="26" height="3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

export function MuscleIcon({ kind = "peito", className = "" }: { kind?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {kind === "triceps" ? (
        <>
          <path d="M5 8 C 8 5, 16 5, 19 8 L 19 14 C 16 18, 8 18, 5 14 Z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M9 9 L 9 14 M 15 9 L 15 14" stroke="currentColor" strokeWidth="1.2"/>
        </>
      ) : (
        <>
          <path d="M4 9 C 6 6, 18 6, 20 9 C 20 13, 16 16, 12 16 C 8 16, 4 13, 4 9 Z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M12 7 L 12 16" stroke="currentColor" strokeWidth="1.2"/>
        </>
      )}
    </svg>
  );
}
