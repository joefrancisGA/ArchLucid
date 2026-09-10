import {
  architectureIdentityPath,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { lookupArchitectureDraftParentArchitectureId } from "@/lib/review-package-validation-picker";

export type ResolveGovernanceQueueReturnLocatorInput = {
  readonly runId: string;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

export type GovernanceQueueReturnLocator = {
  readonly architectureDeskHref: string | null;
  readonly reviewJobHref: string;
};

/** Governance queue rows return to the parent architecture desk when known (AO-27). */
export function resolveGovernanceQueueReturnLocator(
  input: ResolveGovernanceQueueReturnLocatorInput,
): GovernanceQueueReturnLocator {
  const architectureId = lookupArchitectureDraftParentArchitectureId(
    input.runId,
    input.draftRegistryEntries,
  );
  const reviewJobHref = resolveArchitectureReviewHref(input.runId, architectureId);

  return {
    architectureDeskHref: architectureId !== null ? architectureIdentityPath(architectureId) : null,
    reviewJobHref,
  };
}
