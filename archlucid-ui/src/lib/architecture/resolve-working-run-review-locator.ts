import {
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { lookupArchitectureDraftParentArchitectureId } from "@/lib/review-package-validation-picker";

export type ResolveWorkingRunReviewLocatorInput = {
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly requestId?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

export type WorkingRunReviewLocator = {
  readonly architectureId: string | null;
  readonly href: string;
};

function resolveArchitectureIdForRun(input: ResolveWorkingRunReviewLocatorInput): string | null {
  const explicit = input.architectureId?.trim() ?? "";

  if (explicit.length > 0) {
    return explicit;
  }

  const fromRegistry = lookupArchitectureDraftParentArchitectureId(
    input.runId,
    input.draftRegistryEntries,
  );

  if (fromRegistry !== null) {
    return fromRegistry;
  }

  const requestId = input.requestId?.trim() ?? "";

  if (requestId.length > 0) {
    return requestId;
  }

  return null;
}

/** Working production call sites: nested review job when parent architecture is known (AO-08). */
export function resolveWorkingRunReviewLocator(
  input: ResolveWorkingRunReviewLocatorInput,
): WorkingRunReviewLocator {
  const runId = input.runId.trim();
  const architectureId = resolveArchitectureIdForRun({ ...input, runId });

  return {
    architectureId,
    href: resolveArchitectureReviewHref(runId, architectureId),
  };
}
