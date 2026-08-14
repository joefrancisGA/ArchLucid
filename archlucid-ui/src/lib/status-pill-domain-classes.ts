import { cn } from "@/lib/utils";

import { enterpriseStatusMetadataFillClass, METADATA_STATUS_TAG_SHELL } from "@/lib/design-tokens";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";

export type StatusPillDomain = "pipeline" | "governance" | "health" | "general";

/** Shared shell for {@link import("@/components/StatusPill")} — metadata label, not a control. */
export const STATUS_PILL_BASE = METADATA_STATUS_TAG_SHELL;

/** Same palette as legacy governance badge helper — now backed by {@link resolveEnterpriseStatusKind}. */
export function governanceDomainBadgeClass(status: string): string {
  return enterpriseStatusMetadataFillClass(resolveEnterpriseStatusKind(status, "governance"));
}

/**
 * Token-backed fills for {@link import("@/components/StatusPill")} via **TB-2285** resolver.
 */
export function statusPillDomainClass(status: string, domain: StatusPillDomain): string {
  return enterpriseStatusMetadataFillClass(resolveEnterpriseStatusKind(status, domain));
}

export function statusPillCombinedClass(status: string, domain: StatusPillDomain): string {
  return cn(STATUS_PILL_BASE, statusPillDomainClass(status, domain));
}
