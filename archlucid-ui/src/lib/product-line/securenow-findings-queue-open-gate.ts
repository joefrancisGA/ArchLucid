import {
  findingsPathForProductLine,
  assignedToMeFindingsPathForProductLine,
} from "@/lib/product-line/securenow-compliance-routes";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type SecureNowFindingsQueueOpenGateInput = {
  readonly isAssignedToMe: boolean;
  readonly pendingOwner: number;
  readonly openRisks: number;
  readonly overdueReview: number;
};

export type SecureNowFindingsQueueOpenGate = {
  readonly id: string;
  readonly message: string;
  readonly ctaLabel: string;
  readonly href: string;
};

/** Mirrors review open-gate discipline for the SecureNow findings queue header. */
export function resolveSecureNowFindingsQueueOpenGate(
  productLine: ProductLineId,
  input: SecureNowFindingsQueueOpenGateInput,
): SecureNowFindingsQueueOpenGate | null {
  const basePath = input.isAssignedToMe
    ? assignedToMeFindingsPathForProductLine(productLine)
    : findingsPathForProductLine(productLine);

  if (input.pendingOwner > 0) {
    return {
      id: "needs-owner",
      message: "Some findings still need an owner before remediation can progress.",
      ctaLabel: "Show findings needing owner",
      href: `${basePath}?filter=no-owner`,
    };
  }

  if (input.openRisks > 0) {
    return {
      id: "open-findings",
      message: "Open findings still need triage or disposition.",
      ctaLabel: "Show open findings",
      href: `${basePath}?filter=open`,
    };
  }

  if (input.overdueReview > 0) {
    return {
      id: "overdue-review",
      message: "Some findings are overdue for review.",
      ctaLabel: "Show overdue review",
      href: `${basePath}?filter=overdue-review`,
    };
  }

  return null;
}
