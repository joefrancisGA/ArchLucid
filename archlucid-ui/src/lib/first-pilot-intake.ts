import type { ActiveTenantContextView } from "@/lib/active-tenant-context-display";
import {
  describeQuickStartAnalyzableEvidenceGap,
  hasQuickStartAnalyzableEvidenceClass,
  type QuickStartAnalyzableEvidenceInput,
} from "@/lib/first-pilot-analyzable-evidence";
import {
  describeFirstPilotReviewTitleGap,
  isFirstPilotReviewTitleAcceptable,
} from "@/lib/first-pilot-review-title-quality";
import { GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL } from "@/lib/guided-intake-copy";
import {
  describeUniversalIntakeMustGap,
  isUniversalIntakeMustComplete,
  type UniversalIntakeMustCompletenessInput,
} from "@/lib/universal-intake-must-completeness";

/** Default evidence category label when operators do not manually tag uploads. */
export const DEFAULT_ARCHITECTURE_EVIDENCE_CATEGORY = "Architecture evidence";

export const FIRST_PILOT_MIN_TITLE_CHARS = 2;
export const FIRST_PILOT_MIN_BRIEF_CHARS = 100;
export const FIRST_PILOT_EVIDENCE_ONLY_BRIEF_MIN_CHARS = 100;
export const FIRST_PILOT_ARCHITECTURE_CONTEXT_MIN_HELPER =
  `${FIRST_PILOT_MIN_BRIEF_CHARS} characters minimum if you are not attaching evidence.`;

export type FirstPilotIntakeReadinessInput = {
  readonly title: string;
  /**
   * Operator-entered context only. Never pass the output of {@link buildEvidenceBackedIntakeBrief}:
   * its boilerplate alone exceeds {@link FIRST_PILOT_MIN_BRIEF_CHARS}, so readiness would always pass.
   */
  readonly brief: string;
  readonly evidenceFileCount: number;
  readonly evidenceFileNames: readonly string[];
  readonly limitedEvidenceAnalysisAcknowledged: boolean;
  readonly l0Must: UniversalIntakeMustCompletenessInput;
};

function toAnalyzableEvidenceInput(input: FirstPilotIntakeReadinessInput): QuickStartAnalyzableEvidenceInput {
  return {
    operatorBrief: input.brief,
    evidenceFileNames: input.evidenceFileNames,
    limitedEvidenceAnalysisAcknowledged: input.limitedEvidenceAnalysisAcknowledged,
  };
}

export function normalizeFirstPilotReviewTitle(title: string): string {
  return title.trim();
}

export function buildEvidenceBackedIntakeBrief(title: string, files: readonly File[], userBrief: string): string {
  const trimmedBrief = userBrief.trim();

  if (trimmedBrief.length >= FIRST_PILOT_MIN_BRIEF_CHARS) {
    return trimmedBrief;
  }

  const reviewTitle = normalizeFirstPilotReviewTitle(title) || "this architecture";
  const fileLines = files.map((file) => `- ${file.name}`).join("\n");
  const attachmentSection =
    fileLines.length > 0
      ? `\n\nAttached files:\n${fileLines}`
      : "";

  const summary = [
    `Architecture review intake for "${reviewTitle}".`,
    "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
    "Treat each upload as architecture evidence unless a more specific category was supplied.",
  ].join(" ");

  // The attachment block already opens with its own blank line, so it is appended without a separator.
  return `${summary}${attachmentSection}`.trim();
}

export function isFirstPilotIntakeReady(input: FirstPilotIntakeReadinessInput): boolean {
  const titleReady = isFirstPilotReviewTitleAcceptable(input.title);
  const briefReady = input.brief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS;
  const evidenceReady = input.evidenceFileCount > 0;
  const l0Ready = isUniversalIntakeMustComplete(input.l0Must);
  const analyzableEvidenceReady = hasQuickStartAnalyzableEvidenceClass(toAnalyzableEvidenceInput(input));

  if (!titleReady || !l0Ready || !analyzableEvidenceReady) {
    return false;
  }

  return briefReady || evidenceReady;
}

/**
 * Names what still blocks submit, for the line beside a disabled start button (TB-2005).
 * Delegates the ready check to {@link isFirstPilotIntakeReady} so this can never promise a gate that does not exist.
 */
export function describeFirstPilotIntakeGap(input: FirstPilotIntakeReadinessInput): string | null {
  if (isFirstPilotIntakeReady(input)) {
    return null;
  }

  const titleReady = isFirstPilotReviewTitleAcceptable(input.title);
  const briefLength = input.brief.trim().length;
  const evidenceReady = input.evidenceFileCount > 0;
  const l0Gap = describeUniversalIntakeMustGap(input.l0Must);
  const titleGap = describeFirstPilotReviewTitleGap(input.title);

  if (!titleReady && !evidenceReady && briefLength === 0 && input.title.trim().length === 0) {
    return `Add a review title and attach evidence or add architecture context (at least ${FIRST_PILOT_MIN_BRIEF_CHARS} characters) to start.`;
  }

  if (!titleReady) {
    return titleGap ?? "Add a review title that names the system and the decision.";
  }

  if (!evidenceReady && briefLength === 0) {
    return "Attach evidence or add architecture context to start.";
  }

  if (!evidenceReady && briefLength > 0 && briefLength < FIRST_PILOT_MIN_BRIEF_CHARS) {
    return `${GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL} needs at least ${FIRST_PILOT_MIN_BRIEF_CHARS} characters (${briefLength} so far), or attach evidence instead.`;
  }

  const analyzableGap = describeQuickStartAnalyzableEvidenceGap(toAnalyzableEvidenceInput(input));

  if (analyzableGap !== null) {
    return analyzableGap;
  }

  if (l0Gap !== null) {
    return l0Gap;
  }

  return null;
}

/** Compact write-target line above the first-pilot start CTA — mirrors quick-review scope disclosure. */
export function formatFirstPilotIntakeWriteDestination(context: ActiveTenantContextView): string {
  const workspaceLabel =
    context.workspaceLabel ?? context.workspaceId ?? "current workspace";

  return `This review will be created in ${workspaceLabel} (${context.displayName}).`;
}
