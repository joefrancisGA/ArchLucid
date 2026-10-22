import { activeSampleRunIdSet, getActiveSampleScenario, isActiveSampleHeroFindingId } from "@/lib/samples/registry";

/**
 * Demo sample universes shared by marketing `/see-it` and operator `/why-archlucid`.
 * Fail closed to `unknown` when Claims and Contoso signals collide or neither is asserted.
 */
export type DemoSampleUniverse = "claims" | "contoso" | "unknown";

/** Retail baseline (trusted baseline seed) demo run ids (`ToString("N")` from ContosoRetailDemoIdentifiers). */
export const CONTOSO_RETAIL_DEMO_RUN_IDS = new Set<string>([
  "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
  "6e8c4a102b1f4c9a9d3e10b2a4f0c502",
  "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
  "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c502",
]);

export const CLAIMS_SHOWCASE_RUN_IDS = activeSampleRunIdSet();

export function normalizeDemoSampleToken(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

export function hasClaimsDemoTextSignals(haystack: string): boolean {
  const normalized = haystack.toLowerCase();

  return getActiveSampleScenario().universeTextSignals.some((signal) => normalized.includes(signal));
}

export function hasContosoDemoTextSignals(haystack: string): boolean {
  return /\bcontoso\b/.test(haystack) || /\bretail (baseline|hardened|checkout|online store)\b/i.test(haystack);
}

export type ResolveDemoSampleUniverseArgs = {
  readonly runId?: string | null;
  readonly textHints?: string | null;
};

/**
 * Classifies a demo sample so chrome cannot claim Claims over Contoso (TB-1279 / TB-1306).
 */
export function resolveDemoSampleUniverse(args: ResolveDemoSampleUniverseArgs): DemoSampleUniverse {
  const runId = normalizeDemoSampleToken(args.runId);
  const haystack = `${runId}\n${normalizeDemoSampleToken(args.textHints)}`;

  const claimsByRunId = CLAIMS_SHOWCASE_RUN_IDS.has(runId);
  const contosoByRunId = CONTOSO_RETAIL_DEMO_RUN_IDS.has(runId);
  const claimsByText = hasClaimsDemoTextSignals(haystack);
  const contosoByText = hasContosoDemoTextSignals(haystack);

  if ((claimsByRunId || claimsByText) && (contosoByRunId || contosoByText)) {
    return "unknown";
  }

  if (claimsByRunId || claimsByText) {
    return "claims";
  }

  if (contosoByRunId || contosoByText) {
    return "contoso";
  }

  return "unknown";
}
