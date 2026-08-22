/**
 * Deterministic sponsor-facing paraphrase of a finding (TB-2192).
 *
 * Distinct from TB-2154 derivation sentences and from FindingExplainPanel (LLM audit/trace).
 * V1 uses templates only — no new LLM call — so export packets stay trustworthy and reviewable.
 */

import { FINDING_DERIVATION_NOT_AVAILABLE } from "@/lib/findings/finding-derivation-sentence";

export const SPONSOR_PLAIN_ENGLISH_CAUTION =
  "Sponsor-facing paraphrase only — not new evidence, not a formal risk acceptance, and not a substitute for the recorded finding and evidence trail.";

export type SponsorPlainEnglishFindingInput = {
  readonly title?: string | null;
  readonly message?: string | null;
  readonly severity?: string | null;
  /** Optional TB-2154 derivation sentence; omitted when unavailable. */
  readonly derivationSentence?: string | null;
  readonly residualRisk?: string | null;
};

export type SponsorPlainEnglishFinding = {
  readonly headline: string;
  readonly plainEnglish: string;
  readonly sponsorCaution: string;
};

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSeverityKey(severity: string): string {
  return severity.trim().toLowerCase();
}

/** Urgency clause for sponsors — avoids stop-ship language except for clearly critical labels. */
export function sponsorSeverityUrgencyClause(severity: string | null | undefined): string {
  const raw = nonEmpty(severity);

  if (raw === null) {
    return "This review recorded a finding that still needs a human resolve decision.";
  }

  const key = normalizeSeverityKey(raw);

  if (key.includes("critical") || key.includes("blocker") || key === "blocking" || key === "error") {
    return "Treat this as a material delivery, compliance, or security concern that needs an owner decision before rollout.";
  }

  if (key.includes("high") || key === "warning") {
    return "Treat this as an elevated concern that should be explained to stakeholders before it is deferred.";
  }

  if (key.includes("medium") || key.includes("moderate")) {
    return "Treat this as a planning-priority gap worth scheduling — not an automatic stop-ship.";
  }

  if (key.includes("low") || key.includes("info") || key.includes("informational") || key.includes("minor")) {
    return "Treat this as an improvement opportunity rather than an urgent rollout risk.";
  }

  return `This review labeled severity "${raw}"; compare it with peer findings before escalating.`;
}

function buildHeadline(title: string | null, severity: string | null): string {
  if (title !== null && severity !== null) {
    return `${severity} finding: ${title}`;
  }

  if (title !== null) {
    return title;
  }

  if (severity !== null) {
    return `${severity} architecture finding`;
  }

  return "Architecture review finding";
}

function usableDerivationSentence(derivationSentence: string | null): string | null {
  if (derivationSentence === null) {
    return null;
  }

  if (derivationSentence === FINDING_DERIVATION_NOT_AVAILABLE) {
    return null;
  }

  return derivationSentence;
}

/**
 * Builds a short sponsor paraphrase from known finding fields.
 * Never invents evidence, owners, or remediation status beyond the supplied residual-risk note.
 */
export function buildSponsorPlainEnglishFinding(
  input: SponsorPlainEnglishFindingInput,
): SponsorPlainEnglishFinding {
  const title = nonEmpty(input.title);
  const message = nonEmpty(input.message);
  const severity = nonEmpty(input.severity);
  const derivation = usableDerivationSentence(nonEmpty(input.derivationSentence));
  const residualRisk = nonEmpty(input.residualRisk);

  const parts: string[] = [sponsorSeverityUrgencyClause(severity)];

  if (message !== null) {
    parts.push(`In plain terms: ${message}`);
  } else if (title !== null) {
    parts.push(`The recorded finding is titled "${title}".`);
  } else {
    parts.push("No export-ready finding summary was supplied beyond severity and related notes.");
  }

  if (derivation !== null) {
    parts.push(`How reviewers derived it: ${derivation}`);
  }

  if (residualRisk !== null) {
    parts.push(`Residual risk note: ${residualRisk}`);
  }

  parts.push(
    "Share only with the linked evidence and policy record; this wording does not add proof.",
  );

  return {
    headline: buildHeadline(title, severity),
    plainEnglish: parts.join(" "),
    sponsorCaution: SPONSOR_PLAIN_ENGLISH_CAUTION,
  };
}
