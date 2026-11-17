export function formatRemediationFactoryAttackPathOverflowLine(remainingPathCount: number): string {
  const count = Math.max(0, Math.floor(remainingPathCount));

  if (count <= 0) {
    return "";
  }

  const noun = count === 1 ? "stored path" : "stored paths";

  return `and ${count} more ${noun} (not listed here; use the table below for full stored snapshot paths)`;
}