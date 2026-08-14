import type { ActiveTenantContextView } from "@/lib/active-tenant-context-display";
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

export type FirstPilotIntakeReadinessInput = {
  readonly title: string;
  /**
   * Operator-entered context only. Never pass the output of {@link buildEvidenceBackedIntakeBrief}:
   * its boilerplate alone exceeds {@link FIRST_PILOT_MIN_BRIEF_CHARS}, so readiness would always pass.
   */
  readonly brief: string;
  readonly evidenceFileCount: number;
  readonly l0Must: UniversalIntakeMustCompletenessInput;
};

export function normalizeFirstPilotReviewTitle(title: string): string {
  const trimmed = title.trim();

  if (trimmed.length >= FIRST_PILOT_MIN_TITLE_CHARS) {
    return trimmed;
  }

  return "Architecture review";
}

export function buildEvidenceBackedIntakeBrief(title: string, files: readonly File[], userBrief: string): string {
  const trimmedBrief = userBrief.trim();

  if (trimmedBrief.length >= FIRST_PILOT_MIN_BRIEF_CHARS) {
    return trimmedBrief;
  }

  const reviewTitle = normalizeFirstPilotReviewTitle(title);
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
  const titleReady = input.title.trim().length >= FIRST_PILOT_MIN_TITLE_CHARS;
  const briefReady = input.brief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS;
  const evidenceReady = input.evidenceFileCount > 0;
  const l0Ready = isUniversalIntakeMustComplete(input.l0Must);

  return titleReady && (briefReady || evidenceReady) && l0Ready;
}

/**
 * Names what still blocks submit, for the line beside a disabled start button (TB-2005).
 * Delegates the ready check to {@link isFirstPilotIntakeReady} so this can never promise a gate that does not exist.
 */
export function describeFirstPilotIntakeGap(input: FirstPilotIntakeReadinessInput): string | null {
  if (isFirstPilotIntakeReady(input)) {
    return null;
  }

  const titleReady = input.title.trim().length >= FIRST_PILOT_MIN_TITLE_CHARS;
  const briefLength = input.brief.trim().length;
  const evidenceReady = input.evidenceFileCount > 0;
  const l0Gap = describeUniversalIntakeMustGap(input.l0Must);

  if (!titleReady && !evidenceReady && briefLength === 0) {
    return `Add a review title and attach evidence or add architecture context (at least ${FIRST_PILOT_MIN_BRIEF_CHARS} characters) to start.`;
  }

  if (!titleReady) {
    return "Add a review title to start.";
  }

  if (!evidenceReady && briefLength === 0) {
    return "Attach evidence or add architecture context to start.";
  }

  if (!evidenceReady && briefLength > 0 && briefLength < FIRST_PILOT_MIN_BRIEF_CHARS) {
    return `Architecture context needs at least ${FIRST_PILOT_MIN_BRIEF_CHARS} characters (${briefLength} so far), or attach evidence instead.`;
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
