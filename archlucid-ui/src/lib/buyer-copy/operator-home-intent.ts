/**
 * Operator home intent chooser and dual-path copy.
 */

import {
  resolveArchitectureDraftRefineGuidanceSentence,
} from "@/lib/architecture/architecture-draft-detail-page-copy";
import { OPERATOR_ATTENTION_KIND_LABELS } from "@/lib/operator/operator-attention-taxonomy";

import { OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA } from "./operator-home-sample";

export const OPERATOR_HOME_COMMAND_CENTER_TAGLINE =
  "Create architecture drafts, govern AI-assisted reviews, track evidence, and produce auditable decisions your organization can trust.";

/** ADR 0067 — names both co-equal jobs; must not imply one precedes the other. */
export const OPERATOR_HOME_INTENT_CHOOSER_HEADING = "Create or review an architecture";

export const OPERATOR_HOME_CONTINUE_ARCHITECTURE_HEADING = "Continue your architecture";

export function formatOperatorHomeContinueDraftHeading(displayName: string): string {
  const trimmedName = displayName.trim();

  if (trimmedName.length > 0) {
    return trimmedName;
  }

  return OPERATOR_HOME_CONTINUE_ARCHITECTURE_HEADING;
}

export const OPERATOR_HOME_ACTIVE_REVIEWS_HEADING = "Reviews in progress";

/** Home list of shell-tracked work, including queued Suggest from overview. */
export const OPERATOR_HOME_IN_PROGRESS_HEADING = "In progress";

export const OPERATOR_HOME_ACTIVE_REVIEWS_LEAD =
  "Open an in-progress review or start another formal review when your architecture is ready.";

export const OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA = "Resume latest draft";

export const OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA = "Continue in review intake";

export const OPERATOR_HOME_CONTINUE_IN_REVIEW_CTA = "Continue in review";

/** Eyebrow on eval-with-drafts home hero — saved draft architecture, not a lifecycle status. */
export const OPERATOR_HOME_DRAFT_ARCHITECTURE_EYEBROW = "Draft architecture";

export function formatOperatorHomeDraftArchitectureEyebrow(
  draftLastEditedLabel: string | null,
): string | null {
  const eyebrow = OPERATOR_HOME_DRAFT_ARCHITECTURE_EYEBROW.trim();
  const trimmedEditedLabel =
    draftLastEditedLabel !== null && draftLastEditedLabel.trim().length > 0
      ? draftLastEditedLabel.trim()
      : null;

  if (trimmedEditedLabel !== null) {

    if (eyebrow.length === 0) {
      return trimmedEditedLabel;
    }

    return `${eyebrow} — ${trimmedEditedLabel}`;
  }

  return eyebrow.length > 0 ? eyebrow : null;
}

export function formatOperatorHomeContinueArchitectureLead(
  draftCount: number,
  reviewReadinessValid = false,
): string {
  const safeCount = Number.isFinite(draftCount) ? Math.max(0, Math.trunc(draftCount)) : 0;
  const refineGuidance = resolveArchitectureDraftRefineGuidanceSentence(reviewReadinessValid);

  if (safeCount === 1) {
    return `1 draft saved — ${refineGuidance}`;
  }

  return `${safeCount} drafts saved — ${refineGuidance}`;
}

/** Single-row draft status beside Resume latest draft on Overview (eval-with-drafts). */
export function formatOperatorHomeCompactDraftStatusRow(
  draftCount: number,
  draftLastEditedLabel: string | null,
  reviewReadinessValid = false,
): string {
  const headline = formatOperatorHomeDraftStatusHeadline(draftCount, draftLastEditedLabel);

  return `${headline} — ${resolveArchitectureDraftRefineGuidanceSentence(reviewReadinessValid)}`;
}

/** Status headline for eval-with-drafts hero — count and last-edited only (refine hint is separate). */
export function formatOperatorHomeDraftStatusHeadline(
  draftCount: number,
  draftLastEditedLabel: string | null,
): string {
  const safeCount = Number.isFinite(draftCount) ? Math.max(0, Math.trunc(draftCount)) : 0;
  const countLabel =
    safeCount === 1 ? "1 architecture draft" : `${safeCount} architecture drafts`;
  const trimmedEditedLabel =
    draftLastEditedLabel !== null && draftLastEditedLabel.trim().length > 0
      ? draftLastEditedLabel.trim()
      : null;

  if (trimmedEditedLabel !== null) {
    return `${countLabel} · ${trimmedEditedLabel}`;
  }

  return countLabel;
}

export function formatOperatorHomePastDraftingLead(displayName: string): string {
  const trimmedName = displayName.trim();

  if (trimmedName.length > 0) {
    return `${trimmedName} is already in review intake — continue from here instead of reopening the draft workspace.`;
  }

  return "This architecture is already in review intake — continue from here instead of reopening the draft workspace.";
}

export function formatOperatorHomeResumeDraftBridge(displayName: string, draftCount: number): string {
  const trimmedName = displayName.trim();
  const safeCount = Number.isFinite(draftCount) ? Math.max(0, Math.trunc(draftCount)) : 0;

  if (trimmedName.length > 0 && safeCount === 1) {
    return `Pick up "${trimmedName}" or start a formal review from the lifecycle steps below.`;
  }

  if (trimmedName.length > 0) {
    return `Pick up "${trimmedName}" — your most recent draft — or start a formal review from the lifecycle steps below.`;
  }

  return "Resume your most recent draft or start a formal review from the lifecycle steps below.";
}

export const OPERATOR_HOME_RECOMMENDED_NEXT_HEADING = "Recommended next";

export const OPERATOR_HOME_YOUR_WORK_HEADING = OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"];

export const OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA = "Continue review";

export const OPERATOR_HOME_OPEN_REVIEW_RECORD_CTA = "Open review record";

export const OPERATOR_HOME_YOUR_WORK_COLUMN_NAME = "Name";

export const OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE = "Type";

export const OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED = "Updated";

export const OPERATOR_HOME_YOUR_WORK_COLUMN_CREATED = "Created";

export const OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS = "Status";

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY_COMPACT =
  "Describe your system or connect cloud inventory to produce a draft architecture.";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY_COMPACT =
  "Attach diagrams, documents, or inventory to run a formal architecture review.";

export function formatOperatorHomeRecommendedNextTitle(title: string): string {
  const trimmedTitle = title.trim();

  if (trimmedTitle.length === 0) {
    return "Continue your in-progress work";
  }

  return `Continue ${trimmedTitle} review`;
}

/**
 * Bold lead label on Overview subtitle (buyer-polished shell).
 * ADR 0067 — the pair is co-equal, so this lead must not number the paths or rank one above the other.
 */
export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL = "One lifecycle, two doors:";

export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY =
  "Create an architecture from any combination of description, uploaded evidence, or connected cloud inventory — or review an architecture you already have.";

export const OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO =
  `${OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL} ${OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY}`;

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE = "Create architecture";

export const OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY =
  "Use any combination of a description, uploaded briefs and diagrams, or read-only cloud inventory from AWS, Azure, or Google Cloud. It produces an architecture draft you can revise, then review when ready.";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE = "Review architecture";

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY =
  "Attach architecture information you already have — diagrams, documents, inventory exports, or connected cloud evidence. It produces findings and evidence you can finalize into a sealed review record.";

/** @deprecated Merged into {@link OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY} on the home review card. */
export const OPERATOR_HOME_REVIEW_ARCHITECTURE_SUPPORT = OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY;

export const OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA = "Start review";

export const OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE = OPERATOR_HOME_REVIEW_ARCHITECTURE_SUPPORT;

export const OPERATOR_HOME_RECOMMENDED_NEXT_LABEL = "Recommended next:";

export const OPERATOR_HOME_RECOMMENDED_NEXT_CREATE_OR_REVIEW = OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA;

export const OPERATOR_HOME_RECOMMENDED_NEXT_START_REVIEW = "Start review";

export const OPERATOR_HOME_RECOMMENDED_NEXT_CREATE_ARCHITECTURE = "Create architecture";

export const OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST = "Open latest review";

export const OPERATOR_HOME_READ_ONLY_INTENT_HINT =
  "Your role can explore samples and learn how reviews work. Ask a workspace administrator for permission to create or start reviews.";

/** Hero title on `/` — first-run intent chooser until the tenant has a committed architecture review. */
export function resolveOperatorHomeHeroHeading(hasWorkspaceActivity: boolean): string {
  return hasWorkspaceActivity
    ? OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING
    : OPERATOR_HOME_INTENT_CHOOSER_HEADING;
}

export const OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING = "Recent activity";
