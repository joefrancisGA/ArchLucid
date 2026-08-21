import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  SIGNED_RECORDS_LIST_PATH,
  signedRecordDetailPath,
} from "@/lib/signed-records-paths";

export type AcceleratorChooserPrerequisiteStatus =
  | "checking"
  | "met"
  | "not-met"
  | "unknown";

export type AcceleratorChooserPrerequisitePresentation = {
  readonly status: AcceleratorChooserPrerequisiteStatus;
  readonly signedRecordHref: string | null;
};

export function resolveAcceleratorChooserPrerequisitePresentation(input: {
  readonly commitQueryPending: boolean;
  readonly commitQueryError: boolean;
  readonly commitContext: CorePilotCommitContext | undefined;
  readonly manifestQueryPending?: boolean;
  readonly manifestId: string | null | undefined;
}): AcceleratorChooserPrerequisitePresentation {
  if (input.commitQueryPending) {
    return { status: "checking", signedRecordHref: null };
  }

  if (input.commitQueryError || input.commitContext === undefined) {
    return { status: "unknown", signedRecordHref: null };
  }

  if (!input.commitContext.hasCommittedManifest) {
    return { status: "not-met", signedRecordHref: null };
  }

  // Stay on Checking until the signed-record id resolve finishes so the CTA never
  // points at a review workspace while labeled as a Finalized review record.
  if (input.manifestQueryPending === true) {
    return { status: "checking", signedRecordHref: null };
  }

  const trimmedManifestId = input.manifestId?.trim() ?? "";

  if (trimmedManifestId.length > 0) {
    return {
      status: "met",
      signedRecordHref: signedRecordDetailPath(trimmedManifestId),
    };
  }

  return {
    status: "met",
    signedRecordHref: SIGNED_RECORDS_LIST_PATH,
  };
}
