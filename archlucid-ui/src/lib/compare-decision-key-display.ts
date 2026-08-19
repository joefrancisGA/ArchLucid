/**
 * Stable human-readable label for canonical decision ids from manifest compare payloads.
 * Unknown keys remain machine-readable alongside the dotted id.
 */
export function decisionKeyDisplay(decisionKey: string): string {
  const k = decisionKey.trim();

  if (k.length === 0) {
    return "—";
  }

  const map: Record<string, string> = {
    "claims.intake.boundary": "Claims intake — integration boundary",
    "claims.intake.phi-handling": "Claims intake — PHI handling posture",
    "claims.intake.channel-adapters": "Claims intake — channel adapters",
  };

  const friendly = map[k];

  return friendly ?? k.replace(/\./g, " · ");
}
