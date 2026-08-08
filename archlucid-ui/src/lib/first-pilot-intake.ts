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
    "Evaluate the attached materials for topology, cost, compliance, security, and policy-pack violations.",
    "Treat each upload as architecture evidence unless a more specific category was supplied.",
  ].join(" ");

  // The attachment block already opens with its own blank line, so it is appended without a separator.
  return `${summary}${attachmentSection}`.trim();
}

export function isFirstPilotIntakeReady(input: FirstPilotIntakeReadinessInput): boolean {
  const titleReady = input.title.trim().length >= FIRST_PILOT_MIN_TITLE_CHARS;
  const briefReady = input.brief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS;
  const evidenceReady = input.evidenceFileCount > 0;

  return titleReady && (briefReady || evidenceReady);
}

/**
 * Names what still blocks submit, for the line beside a disabled start button (TB-2005).
 * Delegates the ready check to {@link isFirstPilotIntakeReady} so this can never promise a gate that does not exist.
 *
 * Stays silent while the title is missing: an empty first field is already visible, and naming it would
 * greet the page with an instruction. Only the evidence-or-context rule is invisible from the controls,
 * since either one satisfies it and the context threshold is not otherwise stated.
 */
export function describeFirstPilotIntakeGap(input: FirstPilotIntakeReadinessInput): string | null {
  if (isFirstPilotIntakeReady(input)) {
    return null;
  }

  if (input.title.trim().length < FIRST_PILOT_MIN_TITLE_CHARS) {
    return null;
  }

  const briefLength = input.brief.trim().length;

  // Naming the shortfall matters once context exists: otherwise "add architecture context" reads as
  // wrong to someone who just added some, with no way to see how much more is needed.
  if (briefLength > 0) {
    return `Architecture context needs at least ${FIRST_PILOT_MIN_BRIEF_CHARS} characters (${briefLength} so far), or attach evidence instead.`;
  }

  return "Attach evidence or add architecture context to start.";
}
