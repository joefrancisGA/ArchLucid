/** Default evidence category label when operators do not manually tag uploads. */
export const DEFAULT_ARCHITECTURE_EVIDENCE_CATEGORY = "Architecture evidence";

export const FIRST_PILOT_MIN_TITLE_CHARS = 2;
export const FIRST_PILOT_MIN_BRIEF_CHARS = 100;
export const FIRST_PILOT_EVIDENCE_ONLY_BRIEF_MIN_CHARS = 100;

export type FirstPilotIntakeReadinessInput = {
  readonly title: string;
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
  const fileLines = files.map((file) => `- ${file.name} (${DEFAULT_ARCHITECTURE_EVIDENCE_CATEGORY})`).join("\n");
  const attachmentSection =
    fileLines.length > 0
      ? `\n\nAttached architecture evidence:\n${fileLines}`
      : "";

  return [
    `Architecture review intake for "${reviewTitle}".`,
    "Evaluate the attached materials for topology, cost, compliance, security, and policy-pack violations.",
    "Treat each upload as architecture evidence unless a more specific category was supplied.",
    attachmentSection,
  ]
    .join("")
    .trim();
}

export function isFirstPilotIntakeReady(input: FirstPilotIntakeReadinessInput): boolean {
  const titleReady = input.title.trim().length >= FIRST_PILOT_MIN_TITLE_CHARS;
  const briefReady = input.brief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS;
  const evidenceReady = input.evidenceFileCount > 0;

  return titleReady && (briefReady || evidenceReady);
}
