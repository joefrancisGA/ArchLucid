/**
 * Regression guard for customer-facing integration copy (Teams, ITSM product pages).
 * Blocks deployment-operator vocabulary from re-entering stable copy constants (TB-776).
 */
export const CUSTOMER_INTEGRATION_BANNED_PHRASES: readonly string[] = [
  "host configuration",
  "tenant sql",
  "key vault materialization",
  "integrations:itsm",
  "vendor probe",
  "smoke checklist",
] as const;

export function listCustomerIntegrationCopyViolations(
  surfaces: Readonly<Record<string, string>>,
): string[] {
  const violations: string[] = [];

  for (const [surfaceId, text] of Object.entries(surfaces)) {
    const normalized = text.toLowerCase();

    for (const phrase of CUSTOMER_INTEGRATION_BANNED_PHRASES) {

      if (normalized.includes(phrase)) {
        violations.push(`${surfaceId}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}
