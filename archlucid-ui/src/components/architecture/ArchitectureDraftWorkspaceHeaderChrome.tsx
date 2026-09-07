"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { ArchitectureDraftDetailBreadcrumb } from "@/app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBreadcrumb";
import { ArchitectureDraftDeleteControl } from "@/components/architecture/ArchitectureDraftDeleteControl";
import { ArchitectureDraftRoomHeaderButton } from "@/components/architecture/ArchitectureDraftRoomHeaderButton";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE,
  resolveArchitectureDraftAutosaveSentence,
  resolveArchitectureDraftRefineGuidanceSentence,
} from "@/lib/architecture/architecture-draft-detail-page-copy";
import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE } from "@/lib/architectures-draft-evidence-copy";
import { OPERATOR_LINK, OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureDraftWorkspaceBodyProps } from "./ArchitectureDraftWorkspaceBody";

type ArchitectureDraftWorkspaceHeaderChromeProps = Pick<
  ArchitectureDraftWorkspaceBodyProps,
  | "draftId"
  | "isDetailDraft"
  | "buyerPolishedShell"
  | "isNewDraft"
  | "workspaceHeading"
  | "workspaceLead"
  | "reviewReadiness"
  | "linkedReviewId"
  | "parentArchitectureId"
  | "draft"
>;

export function ArchitectureDraftWorkspaceHeaderChrome(
  props: ArchitectureDraftWorkspaceHeaderChromeProps,
): React.JSX.Element | null {
  const {
    draftId,
    isDetailDraft,
    buyerPolishedShell,
    isNewDraft,
    workspaceHeading,
    workspaceLead,
    reviewReadiness,
    linkedReviewId,
    parentArchitectureId,
    draft,
  } = props;

  return (
    <>
      {isDetailDraft && buyerPolishedShell ? (
        <ArchitectureDraftDetailBreadcrumb draftLabel={workspaceHeading} />
      ) : null}

      {!isNewDraft ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1
              className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}
              data-testid="architecture-draft-workspace-title"
            >
              {workspaceHeading}
            </h1>
            <p
              className={cn("m-0", OPERATOR_PAGE_LEAD_MEASURE, OPERATOR_TYPOGRAPHY.helper)}
              data-testid="architecture-draft-workspace-lead"
            >
              {buyerPolishedShell ? (
                <>
                  {ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE}{" "}
                  <InlineGuidanceText
                    text={resolveArchitectureDraftRefineGuidanceSentence(reviewReadiness.isValid)}
                  />{" "}
                  {resolveArchitectureDraftAutosaveSentence(!isNewDraft && draftId.trim().length > 0)}
                </>
              ) : (
                workspaceLead
              )}
            </p>
            {isDetailDraft && buyerPolishedShell ? (
              <PageHeaderClaimDiscipline
                text={ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE}
                testId="architecture-draft-detail-claim-discipline"
                className="mt-2 text-left"
              />
            ) : null}
            {linkedReviewId !== null ? (
              <Link
                href={resolveArchitectureReviewHref(linkedReviewId, parentArchitectureId)}
                className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
              >
                Open linked review
              </Link>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ArchitectureDraftRoomHeaderButton
                linkedReviewId={linkedReviewId}
                parentArchitectureId={parentArchitectureId}
              />
              <PageContextualHelpButton />
            </div>
            <ArchitectureDraftDeleteControl
              draftId={draftId}
              displayName={workspaceHeading}
              linkedReviewId={linkedReviewId}
              serverStatus={draft?.status ?? null}
              createdByUserId={draft?.createdByUserId ?? null}
              testId="architecture-draft-delete-workspace"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
