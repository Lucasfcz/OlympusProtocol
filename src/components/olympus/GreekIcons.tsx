import type { SVGProps } from "react";

const stroke = { stroke: "#C9A84C", fill: "none", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function LaurelIcon({ size = 24, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...stroke} {...p}>
      <path d="M16 28 C 8 28 4 20 4 14 C 4 10 6 8 8 7" />
      <path d="M16 28 C 24 28 28 20 28 14 C 28 10 26 8 24 7" />
      {[0,1,2,3].map(i => (
        <ellipse key={`L${i}`} cx={7 + i} cy={14 + i*3} rx="3" ry="1.4" transform={`rotate(-40 ${7+i} ${14+i*3})`} />
      ))}
      {[0,1,2,3].map(i => (
        <ellipse key={`R${i}`} cx={25 - i} cy={14 + i*3} rx="3" ry="1.4" transform={`rotate(40 ${25-i} ${14+i*3})`} />
      ))}
    </svg>
  );
}

export function TorchIcon({ size = 24, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...stroke} {...p}>
      <path d="M16 3 C 12 8 12 12 16 15 C 20 12 20 8 16 3 Z" />
      <path d="M13 17 L 19 17 L 18 20 L 14 20 Z" />
      <line x1="16" y1="20" x2="16" y2="29" />
    </svg>
  );
}

export function HermesWingsIcon({ size = 24, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...stroke} {...p}>
      <path d="M16 16 C 12 12 8 12 3 15 C 7 15 9 16 11 18" />
      <path d="M16 16 C 20 12 24 12 29 15 C 25 15 23 16 21 18" />
      <path d="M14 19 L 18 19" />
    </svg>
  );
}

export function LightningIcon({ size = 24, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...stroke} {...p}>
      <path d="M18 3 L 8 18 L 15 18 L 12 29 L 24 12 L 17 12 Z" />
    </svg>
  );
}

export function MountainIcon({ size = 24, ...p }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...stroke} {...p}>
      <path d="M3 26 L 12 12 L 18 20 L 22 15 L 29 26 Z" />
    </svg>
  );
}
