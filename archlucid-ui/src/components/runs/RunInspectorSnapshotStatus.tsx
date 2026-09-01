import { cn } from "@/lib/utils";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

function snapshotLabel(ok: boolean | undefined): string {
  if (ok === true) {
    return "✓";
  }

  return " — ";
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
  return (
    <div>
      <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
        {buyerPolished ? "Evidence status" : "Pipeline output"}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{artifactNote}</p>
      <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        <li className="flex justify-between gap-2">
          <span>Source context captured</span>
          <span aria-label={run.hasContextSnapshot ? "Context snapshot present" : "Context snapshot missing"}>
            {snapshotLabel(run.hasContextSnapshot)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>{buyerPolished ? BUYER_SURFACE_VOCABULARY.evidenceGraph : "Graph generated"}</span>
          <span
            aria-label={
              graphTrailReady ? "Decision traceability graph ready for this review" : "Graph snapshot missing"
            }
          >
            {snapshotLabel(graphTrailReady)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>{buyerPolished ? "Risks reviewed" : "Findings reviewed"}</span>
          <span aria-label={run.hasFindingsSnapshot ? "Findings snapshot present" : "Findings snapshot missing"}>
            {snapshotLabel(run.hasFindingsSnapshot)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>{buyerPolished ? "Package finalized" : "Review finalized"}</span>
          <span aria-label={run.hasGoldenManifest ? `${SIGNED_MANIFEST_LABEL} present` : `${SIGNED_MANIFEST_LABEL} missing`}>
            {snapshotLabel(run.hasGoldenManifest)}
          </span>
        </li>
      </ul>
    </div>
  );
}
