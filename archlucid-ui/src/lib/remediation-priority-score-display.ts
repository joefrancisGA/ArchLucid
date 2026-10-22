/** Advisory queue sort key — not buyer risk or likelihood (UU-424). */
export function formatRemediationPrioritySortKeyLine(totalScore: number): string {
  return `Sort key ${totalScore.toFixed(4)}. Ordering only — not a percentage, probability, or live risk score.`;
}
