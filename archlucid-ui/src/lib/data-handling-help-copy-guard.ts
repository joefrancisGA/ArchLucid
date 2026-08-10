/** Labels that must not resolve to the public Trust Center marketing route. */
export const MISLEADING_TRUST_CENTER_HELP_LABEL_PHRASES = [
  "your contracted diligence pack",
  "contracted diligence pack",
  "tenant diligence pack",
  "your tenant diligence",
] as const;

export function findMisleadingTrustCenterHelpLabels(fileContent: string): string[] {
  const normalized = fileContent.toLowerCase();

  if (!normalized.includes('"/trust"') && !normalized.includes("'/trust'")) {
    return [];
  }

  return MISLEADING_TRUST_CENTER_HELP_LABEL_PHRASES.filter((phrase) => normalized.includes(phrase));
}
