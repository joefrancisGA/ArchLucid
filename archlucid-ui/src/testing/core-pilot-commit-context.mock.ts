import { vi } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";

export const emptyCorePilotCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

/** Vitest partial mock — keeps module exports and wires cached reads to the same fn. */
export async function createCorePilotCommitContextModuleMock(
  importOriginal: <T>() => Promise<T>,
  initialContext: CorePilotCommitContext = emptyCorePilotCommitContext,
) {
  const actual = await importOriginal<typeof import("@/lib/core-pilot-commit-context")>();
  const fetchCorePilotCommitContext = vi.fn(async () => initialContext);

  return {
    ...actual,
    fetchCorePilotCommitContext,
    fetchCorePilotCommitContextCached: vi.fn(async () => fetchCorePilotCommitContext()),
    invalidateCorePilotCommitContextCache: vi.fn(async () => undefined),
  };
}
