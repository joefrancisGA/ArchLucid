/**
 * TB-2220 companion — tenant-scoped mutate chip for identity provider settings.
 * Identity configuration applies to every workspace in the organization, not one workspace.
 */

import {
  readActiveTenantContext,
  resolveActiveTenantContext,
  type ActiveTenantContextView,
} from "@/lib/active-tenant-context-display";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

/** Prefix shown before the tenant name on tenant-wide mutate CTAs. */
export const MUTATING_IN_TENANT_CHIP_PREFIX = "Applies tenant-wide" as const;

export type MutatingInTenantChipCopy = {
  readonly prefix: typeof MUTATING_IN_TENANT_CHIP_PREFIX;
  readonly tenantScopeLabel: string;
  /** Full accessible label: "{prefix}: {tenantScopeLabel}". */
  readonly label: string;
};

export function formatMutatingInTenantChipLabel(
  tenantScopeLabel: string,
  prefix: string = MUTATING_IN_TENANT_CHIP_PREFIX,
): string {
  const trimmedLabel = tenantScopeLabel.trim();
  const trimmedPrefix = prefix.trim();

  if (trimmedLabel.length === 0) {
    return trimmedPrefix;
  }

  if (trimmedPrefix.length === 0) {
    return trimmedLabel;
  }

  return `${trimmedPrefix}: ${trimmedLabel}`;
}

export function buildMutatingInTenantChipCopy(tenantScopeLabel: string): MutatingInTenantChipCopy {
  const label = formatMutatingInTenantChipLabel(tenantScopeLabel);

  return {
    prefix: MUTATING_IN_TENANT_CHIP_PREFIX,
    tenantScopeLabel,
    label,
  };
}

/** Resolve chip copy from tenant context (SSR-safe with null scope). */
export function resolveMutatingInTenantChipFromContext(
  context: ActiveTenantContextView | null,
): MutatingInTenantChipCopy {
  const tenantScopeLabel = context?.displayName?.trim() ?? "";

  return buildMutatingInTenantChipCopy(tenantScopeLabel.length > 0 ? tenantScopeLabel : "this organization");
}

/** Resolve chip copy from an operator scope record (SSR-safe with null). */
export function resolveMutatingInTenantChipFromRecord(
  record: OperatorScopeRecord | null,
): MutatingInTenantChipCopy {
  return resolveMutatingInTenantChipFromContext(resolveActiveTenantContext(record));
}

/** Browser-side reader; uses the same tenant display name as the scope switcher footer. */
export function readMutatingInTenantChipCopy(): MutatingInTenantChipCopy {
  return resolveMutatingInTenantChipFromContext(readActiveTenantContext());
}
