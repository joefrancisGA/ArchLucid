"use client";

import Link from "next/link";

import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { Button } from "@/components/ui/button";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import {
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_SKETCH_HELPER,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING,
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_PRODUCTION_DISCLAIMER,
  architectureDeskCloneSketchHref,
} from "@/lib/system-not-job-impact-preview-envelope-entry";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ImpactPreviewPolicyEnvelopeEntryStripProps = {
  readonly architectureId: string;
};

/**
 * SN-007 — Working nested Impact preview entry honesty: policy envelope, not Career architecture what-if.
 */
export function ImpactPreviewPolicyEnvelopeEntryStrip(
  props: ImpactPreviewPolicyEnvelopeEntryStripProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();
  const identityQuery = useArchitectureIdentityQuery(architectureId, architectureId.length > 0);
  const currentDraftId = identityQuery.data?.currentDraftId?.trim() ?? "";
  const deskHref = architectureDeskCloneSketchHref(architectureId);

  return (
    <section
      className={cn("space-y-3 rounded-md border p-4", DESIGN_TOKENS.callout.info)}
      data-testid="impact-preview-policy-envelope-entry"
    >
      <div className="space-y-1">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING}
        </h2>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="impact-preview-policy-envelope-body">
          {SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY}
        </p>
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="impact-preview-policy-envelope-production-disclaimer"
        >
          {SYSTEM_NOT_JOB_IMPACT_PREVIEW_PRODUCTION_DISCLAIMER}
        </p>
      </div>

      <div className="space-y-2" data-testid="impact-preview-architecture-sketch-cta">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_SKETCH_HELPER}
        </p>

        {currentDraftId.length > 0 ? (
          <ArchitectureDraftCloneSnapshotControl
            draftId={currentDraftId}
            parentArchitectureId={architectureId}
            buttonLabel="Clone from snapshot for architecture sketch"
            testId="impact-preview-architecture-clone-snapshot"
            variant="secondary"
            confirmBeforeClone
          />
        ) : (
          <Button variant="secondary" size="sm" asChild>
            <Link href={deskHref} data-testid="impact-preview-architecture-desk-clone-link">
              {SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_DESK_CTA_LABEL}
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
