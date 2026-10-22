import { cn } from "@/lib/utils";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

function contextSnapshotLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "✓";
  }

  if (ok === false) {
    return "Not captured";
  }

  return "Context snapshot status was not stored.";
}

function graphSnapshotLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "✓";
  }

  if (ok === false) {
    return "Not captured";
  }

  return "Graph snapshot status was not stored.";
}

function findingsSnapshotLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "✓";
  }

  if (ok === false) {
    return "Not captured";
  }

  return "Findings snapshot status was not stored.";
}

function packageSnapshotLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "✓";
  }

  if (ok === false) {
    return "Not captured";
  }

  return "Package snapshot status was not stored.";
}

function contextSnapshotAriaLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "Context snapshot present";
  }

  if (ok === false) {
    return "Context snapshot not captured";
  }

  return "Context snapshot status was not stored.";
}

function graphSnapshotAriaLabel(ok: boolean | undefined, graphTrailReady: boolean): string {
  if (graphTrailReady) {
    return "Decision traceability graph ready for this review";
  }

  if (ok === false) {
    return "Graph snapshot not captured";
  }

  return "Graph snapshot status was not stored.";
}

function findingsSnapshotAriaLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "Findings snapshot present";
  }

  if (ok === false) {
    return "Findings snapshot not captured";
  }

  return "Findings snapshot status was not stored.";
}

function packageSnapshotAriaLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return `${SIGNED_MANIFEST_LABEL} present`;
  }

  if (ok === false) {
    return `${SIGNED_MANIFEST_LABEL} not captured`;
  }

  return "Package snapshot status was not stored.";
}

export type RunInspectorSnapshotStatusProps = {
  readonly run: RunSummary;
  readonly buyerPolished: boolean;
  readonly graphTrailReady: boolean;
  readonly artifactNote: string;
};

export function RunInspectorSnapshotStatus({
  run,
  buyerPolished,
  graphTrailReady,
  artifactNote,
}: RunInspectorSnapshotStatusProps) {
  const graphSnapshotOk = graphTrailReady ? true : run.hasGraphSnapshot;

  return (
    <div>
      <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
        {buyerPolished ? "Evidence status" : "Pipeline output"}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{artifactNote}</p>
      <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        <li className="flex justify-between gap-2">
          <span>Source context captured</span>
          <span aria-label={contextSnapshotAriaLabel(run.hasContextSnapshot)}>
            {contextSnapshotLabel(run.hasContextSnapshot)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>{buyerPolished ? BUYER_SURFACE_VOCABULARY.evidenceGraph : "Graph generated"}</span>
          <span aria-label={graphSnapshotAriaLabel(run.hasGraphSnapshot, graphTrailReady)}>
            {graphSnapshotLabel(graphSnapshotOk)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>{buyerPolished ? "Risks reviewed" : "Findings reviewed"}</span>
          <span aria-label={findingsSnapshotAriaLabel(run.hasFindingsSnapshot)}>
            {findingsSnapshotLabel(run.hasFindingsSnapshot)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>{buyerPolished ? "Package finalized" : "Review finalized"}</span>
          <span aria-label={packageSnapshotAriaLabel(run.hasGoldenManifest)}>
            {packageSnapshotLabel(run.hasGoldenManifest)}
          </span>
        </li>
      </ul>
    </div>
  );
}
