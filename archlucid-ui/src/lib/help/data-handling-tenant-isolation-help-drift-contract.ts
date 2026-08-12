/**
 * TB-1660 — Fail-closed contract for `/help/data-handling` isolation deep-dive content.
 *
 * Prevents regression to TENANT_ISOLATION stub-only bodies or procurement-pack alias chrome.
 */

export type DataHandlingTenantIsolationDriftViolation = {
  readonly code:
    | "missing-three-layers"
    | "missing-non-claims"
    | "missing-layer-enumeration"
    | "stub-dominated"
    | "stub-source-path";
  readonly message: string;
};

/** Phrases that indicate the topic body deferred isolation depth to an external pack stub. */
export const DATA_HANDLING_TENANT_ISOLATION_STUB_DOMINANCE_MARKERS = [
  "live only in the buyer security packet",
  "path-stable procurement-pack alias",
  "path-stable alias for gtm",
  "docs/go-to-market/tenant_isolation.md",
  "tenant_isolation.md",
  "verification-pack generation",
  "generate_tenant_isolation",
] as const;

export const DATA_HANDLING_TENANT_ISOLATION_REQUIRED_NON_CLAIM_MARKERS = [
  "sql row-level security is not the production isolation boundary",
  "what archlucid does not collect",
] as const;

export const DATA_HANDLING_TENANT_ISOLATION_REQUIRED_LAYER_MARKERS = [
  "request layer",
  "application layer",
  "data layer",
] as const;

export const DATA_HANDLING_TENANT_ISOLATION_CANONICAL_SOURCE_SUFFIX =
  "docs/library/customer-facing/DATA_HANDLING.md";

function normalized(markdown: string): string {
  return markdown.toLowerCase();
}

export function findDataHandlingTenantIsolationDriftViolations(
  markdown: string,
  options?: { readonly sourcePath?: string },
): readonly DataHandlingTenantIsolationDriftViolation[] {
  const violations: DataHandlingTenantIsolationDriftViolation[] = [];
  const body = normalized(markdown);

  if (!body.includes("three layers")) {
    violations.push({
      code: "missing-three-layers",
      message: "Data-handling help must include the Three layers isolation overview.",
    });
  }

  const hasNonClaimMarker = DATA_HANDLING_TENANT_ISOLATION_REQUIRED_NON_CLAIM_MARKERS.some((marker) =>
    body.includes(marker),
  );

  if (!hasNonClaimMarker) {
    violations.push({
      code: "missing-non-claims",
      message: "Data-handling help must include explicit non-claim / boundary honesty copy.",
    });
  }

  const missingLayers = DATA_HANDLING_TENANT_ISOLATION_REQUIRED_LAYER_MARKERS.filter(
    (marker) => !body.includes(marker),
  );

  if (missingLayers.length > 0) {
    violations.push({
      code: "missing-layer-enumeration",
      message: `Data-handling help must enumerate isolation layers (${missingLayers.join(", ")}).`,
    });
  }

  const stubHits = DATA_HANDLING_TENANT_ISOLATION_STUB_DOMINANCE_MARKERS.filter((marker) =>
    body.includes(marker),
  );

  if (stubHits.length > 0 && !body.includes("request layer")) {
    violations.push({
      code: "stub-dominated",
      message: `Isolation help is stub-dominated (${stubHits.join("; ")}).`,
    });
  }

  const sourcePath = options?.sourcePath?.toLowerCase() ?? "";

  if (sourcePath.includes("tenant_isolation.md")) {
    violations.push({
      code: "stub-source-path",
      message: "data-handling must load DATA_HANDLING.md, not TENANT_ISOLATION stub source.",
    });
  }

  return violations;
}

export function dataHandlingTenantIsolationMarkdownIsCompliant(
  markdown: string,
  options?: { readonly sourcePath?: string },
): boolean {
  return findDataHandlingTenantIsolationDriftViolations(markdown, options).length === 0;
}
