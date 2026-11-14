import {
  findingsPathForProductLine,
  assignedToMeFindingsPathForProductLine,
} from "@/lib/product-line/securenow-compliance-routes";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-filters";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  appendSecureNowFindingsQueueOpenGateScope,
  type SecureNowFindingsQueueOpenGateScopeParams,
} from "@/lib/product-line/securenow-findings-queue-open-gate-scope";

export type SecureNowFindingsQueueOpenGateInput = {
  readonly isAssignedToMe: boolean;
  readonly pendingOwner: number;
  readonly openRisks: number;
  readonly overdueReview: number;
  readonly scopeParams?: SecureNowFindingsQueueOpenGateScopeParams;
};

export type SecureNowFindingsQueueOpenGate = {
  readonly id: string;
  readonly message: string;
  readonly ctaLabel: string;
  readonly href: string;
};

/** Mirrors review open-gate discipline for the SecureNow findings queue header. */
function isPositiveFiniteCount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function findingsQueueFilterHref(
  productLine: ProductLineId,
  isAssignedToMe: boolean,
  filter: RiskRegisterFilter,
  scopeParams: SecureNowFindingsQueueOpenGateScopeParams,
): string {
  const basePath = isAssignedToMe
    ? assignedToMeFindingsPathForProductLine(productLine)
    : findingsPathForProductLine(productLine);

  const href = buildGovernanceFindingsQueueHref({ basePath, filter });

  return appendSecureNowFindingsQueueOpenGateScope(href, scopeParams);
}

export function resolveSecureNowFindingsQueueOpenGate(
  productLine: ProductLineId,
  input: SecureNowFindingsQueueOpenGateInput,
): ReadonlyArray<SecureNowFindingsQueueOpenGate> {
  const gates: SecureNowFindingsQueueOpenGate[] = [];
  const scopeParams = input.scopeParams ?? {};

  if (isPositiveFiniteCount(input.pendingOwner)) {
    gates.push({
      id: "needs-owner",
      message: "Some findings still need an owner before remediation can progress.",
      ctaLabel: "Show findings needing owner",
      href: findingsQueueFilterHref(productLine, input.isAssignedToMe, "no-owner", scopeParams),
    });
  }

  if (isPositiveFiniteCount(input.openRisks)) {
    gates.push({
      id: "open-findings",
      message: "Open findings still need triage or disposition.",
      ctaLabel: "Show open findings",
      href: findingsQueueFilterHref(productLine, input.isAssignedToMe, "open", scopeParams),
    });
  }

  if (isPositiveFiniteCount(input.overdueReview)) {
    gates.push({
      id: "overdue-review",
      message: "Some findings are overdue for review.",
      ctaLabel: "Show overdue review",
      href: findingsQueueFilterHref(productLine, input.isAssignedToMe, "overdue-review", scopeParams),
    });
  }

  return gates;
}