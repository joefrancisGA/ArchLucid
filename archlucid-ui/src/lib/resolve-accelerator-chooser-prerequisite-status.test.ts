import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { resolveAcceleratorChooserPrerequisitePresentation } from "@/lib/resolve-accelerator-chooser-prerequisite-status";

const committedContext: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 1,
  latestRunId: "run-1",
  firstCommittedRunId: "run-1",
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("resolveAcceleratorChooserPrerequisitePresentation", () => {
  it("returns checking while commit context is loading", () => {
    expect(
      resolveAcceleratorChooserPrerequisitePresentation({
        commitQueryPending: true,
        commitQueryError: false,
        commitContext: undefined,
        manifestId: null,
      }),
    ).toEqual({ status: "checking", signedRecordHref: null });
  });

  it("returns unknown when commit context fails", () => {
    expect(
      resolveAcceleratorChooserPrerequisitePresentation({
        commitQueryPending: false,
        commitQueryError: true,
        commitContext: undefined,
        manifestId: null,
      }),
    ).toEqual({ status: "unknown", signedRecordHref: null });
  });

  it("returns not-met when tenant has no committed manifest", () => {
    expect(
      resolveAcceleratorChooserPrerequisitePresentation({
        commitQueryPending: false,
        commitQueryError: false,
        commitContext: {
          ...committedContext,
          hasCommittedManifest: false,
          firstCommittedRunId: null,
        },
        manifestId: null,
      }),
    ).toEqual({ status: "not-met", signedRecordHref: null });
  });

  it("deep-links to sealed review record detail when manifest id resolves", () => {
    expect(
      resolveAcceleratorChooserPrerequisitePresentation({
        commitQueryPending: false,
        commitQueryError: false,
        commitContext: committedContext,
        manifestQueryPending: false,
        manifestId: "manifest-abc",
      }),
    ).toEqual({
      status: "met",
      signedRecordHref: "/governance/sealed-records/manifest-abc",
    });
  });

  it("stays checking while the signed-record id resolve is pending", () => {
    expect(
      resolveAcceleratorChooserPrerequisitePresentation({
        commitQueryPending: false,
        commitQueryError: false,
        commitContext: committedContext,
        manifestQueryPending: true,
        manifestId: undefined,
      }),
    ).toEqual({ status: "checking", signedRecordHref: null });
  });

  it("falls back to the sealed review records list when manifest id is missing", () => {
    expect(
      resolveAcceleratorChooserPrerequisitePresentation({
        commitQueryPending: false,
        commitQueryError: false,
        commitContext: committedContext,
        manifestQueryPending: false,
        manifestId: null,
      }),
    ).toEqual({
      status: "met",
      signedRecordHref: "/governance/sealed-records",
    });
  });
});
