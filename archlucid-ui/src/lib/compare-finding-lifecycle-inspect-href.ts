import {
  type GovernanceFindingInspectHrefOptions,
  resolveGovernanceQueueAuxiliaryFindingHref,
} from "@/components/governance/findings/governance-findings-navigation";
import type { CompareFindingLifecycleRecord } from "@/lib/compare-finding-lifecycle";

export type BuildCompareFindingLifecycleInspectHrefInput = {
  readonly record: CompareFindingLifecycleRecord;
  readonly priorRunId: string;
  readonly laterRunId: string;
  readonly inspectHrefOptions?: GovernanceFindingInspectHrefOptions;
};

function appendQuery(href: string, extra: Readonly<Record<string, string>>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(extra)) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      continue;
    }

    params.set(key, trimmed);
  }

  const encoded = params.toString();

  if (encoded.length === 0) {
    return href;
  }

  return href.includes("?") ? `${href}&${encoded}` : `${href}?${encoded}`;
}

/** WA-002 — compare lifecycle Open finding stays nested when Working architecture is known. */
export function buildCompareFindingLifecycleInspectHref(
  input: BuildCompareFindingLifecycleInspectHrefInput,
): string | null {
  const laterRunId = input.laterRunId.trim();
  const priorRunId = input.priorRunId.trim();

  if (input.record.currentFindingId !== null) {
    const href = resolveGovernanceQueueAuxiliaryFindingHref(
      laterRunId,
      input.record.currentFindingId,
      { inspectHrefOptions: input.inspectHrefOptions },
    );

    return appendQuery(href, { priorRunId });
  }

  if (input.record.priorFindingId !== null) {
    const href = resolveGovernanceQueueAuxiliaryFindingHref(
      priorRunId,
      input.record.priorFindingId,
      { inspectHrefOptions: input.inspectHrefOptions },
    );

    return appendQuery(href, { laterRunId });
  }

  return null;
}
