import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";

export type ResolveWorkingInhabitedFindingsLandingHrefInput = {
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly requestId?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
  readonly workingMode?: boolean;
};

/**
 * IH-015 / ADR 0100 — Working spawn/continue/unfinished attention lands on architecture-nested
 * findings when the parent architecture is known. Guided and unlinked reviews keep peer job URLs.
 */
export function resolveWorkingInhabitedFindingsLandingHref(
  input: ResolveWorkingInhabitedFindingsLandingHrefInput,
): string {
  const trimmedRunId = input.runId.trim();
  const locator = resolveWorkingRunReviewLocator({
    runId: trimmedRunId,
    architectureId: input.architectureId,
    requestId: input.requestId,
    draftRegistryEntries: input.draftRegistryEntries,
  });

  if (input.workingMode === true && locator.architectureId !== null) {
    return resolveWorkingFindingsInstrumentHref({
      architectureId: locator.architectureId,
      runId: trimmedRunId,
      isWorkingMode: true,
    });
  }

  return locator.href;
}
