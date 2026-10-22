import {
  type GovernanceFindingInspectHrefOptions,
  resolveGovernanceQueueAuxiliaryFindingHref,
} from "@/components/governance/findings/governance-findings-navigation";
import type { AlertRecord } from "@/types/alerts";

/** Deep-link to structured finding detail when the alert row carries {@link AlertRecord.primaryFindingId}. */
export function alertPrimaryFindingDetailHref(
  alert: AlertRecord,
  findingsQueueRunId?: string | null,
  inspectHrefOptions?: GovernanceFindingInspectHrefOptions,
): string | null {
  const runId: string = alert.runId?.trim() ?? "";
  const findingId: string = alert.primaryFindingId?.trim() ?? "";

  if (runId.length === 0 || findingId.length === 0) {
    return null;
  }

  return resolveGovernanceQueueAuxiliaryFindingHref(runId, findingId, {
    inspectHrefOptions,
    findingsQueueRunId,
  });
}
