import type { OperatorNextBestActionDto } from "@/lib/api/tenant-customer-success";
import type { EmptyHomeDoThisNextAction } from "@/lib/resolve-empty-home-do-this-next";
import type { PilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";

export type OperatorCanonicalNextActionSource = "tenant-api" | "client-fallback";

export type OperatorCanonicalNextAction = {
  readonly label: string;
  readonly href: string;
  readonly bridgeCopy: string;
  readonly source?: OperatorCanonicalNextActionSource;
};

/** Parallel home guidance widgets retired by TB-2232 — inventory tests guard against re-mounting. */
export const OPERATOR_HOME_RETIRED_PRIMARY_GUIDANCE_IMPORTS = [
  "OperatorNextActionsCard",
  "CorePilotNextStepsCard",
  "OperatorHomeDoThisNextCard",
] as const;

export function mapTenantNextBestActionToCanonical(
  action: OperatorNextBestActionDto,
): OperatorCanonicalNextAction {
  return {
    label: action.title,
    href: action.href,
    bridgeCopy: action.reason,
    source: "tenant-api",
  };
}

export function resolveOperatorCanonicalNextAction(
  tenantActions: readonly OperatorNextBestActionDto[],
  clientFallback: Omit<OperatorCanonicalNextAction, "source">,
): OperatorCanonicalNextAction {
  if (tenantActions.length > 0) {
    return mapTenantNextBestActionToCanonical(tenantActions[0]);
  }

  return {
    ...clientFallback,
    source: "client-fallback",
  };
}

export function toOperatorCanonicalNextActionFromPilot(
  action: PilotNextBestAction,
): Omit<OperatorCanonicalNextAction, "source"> {
  return {
    label: action.label,
    href: action.href,
    bridgeCopy: action.bridgeCopy,
  };
}

export function toOperatorCanonicalNextActionFromEmptyHome(
  action: EmptyHomeDoThisNextAction,
): Omit<OperatorCanonicalNextAction, "source"> {
  return {
    label: action.label,
    href: action.href,
    bridgeCopy: action.bridgeCopy,
  };
}
