import type { ResultId } from "../domain/types";

/** Original geometric SVG placeholders; no external assets. */
export function PrizeIcon({ kind, className }: { kind: ResultId; className?: string }) {
  return <svg className={className} width="80" height="80" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "coffee" && <>
      <ellipse cx="32" cy="32" rx="18" ry="25" transform="rotate(35 32 32)" />
      <path d="M44 13C22 21 43 40 20 51" />
    </>}
    {kind === "wine" && <>
      <path d="M20 8h24l3 18c1 11-6 17-15 17s-16-6-15-17l3-18ZM32 43v13M22 57h20M18 26h28" />
    </>}
    {kind === "mainPrize" && <path d="m32 6 8 17 19 3-14 14 3 19-16-9-17 9 4-19L5 26l19-3Z" />}
    {kind === "noPrize" && <>
      <circle cx="32" cy="32" r="25" />
      <path d="M21 25h1M42 25h1M22 44c5-8 15-8 20 0" />
    </>}
  </svg>;
}
