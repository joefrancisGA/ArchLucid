/**
 * Sponsor rehearsal preview sections — what a sponsor will see before send (TB-2208).
 * Deterministic assembly only; reuses synopsis + plain-English finding builders when data exists.
 */

import {
  buildSponsorPlainEnglishFinding,
  type SponsorPlainEnglishFindingInput,
} from "@/lib/sponsor-plain-english-finding";

export type SponsorRehearsalSectionId =
  | "executive-summary"
  | "key-findings-plain-english"
  | "residual-risks"
  | "what-is-excluded";

export type SponsorRehearsalSection = {
  readonly id: SponsorRehearsalSectionId;
  readonly title: string;
  readonly body: string;
  readonly isEmpty: boolean;
};

export type SponsorRehearsalPreviewInput = {
  readonly packageTitle?: string | null;
  /** Explicit executive summary text when already composed for export. */
  readonly executiveSummary?: string | null;
  /** Working synopsis paragraph (TB-2183) used when executiveSummary is absent. */
  readonly synopsisParagraph?: string | null;
  readonly findings?: readonly SponsorPlainEnglishFindingInput[] | null;
  /** Extra residual-risk lines beyond finding residualRisk fields. */
  readonly residualRiskNotes?: readonly string[] | null;
  /** Honest exclusions the sponsor packet does not include. */
  readonly excludedNotes?: readonly string[] | null;
};

export const SPONSOR_REHEARSAL_SECTION_ORDER: readonly SponsorRehearsalSectionId[] = [
  "executive-summary",
  "key-findings-plain-english",
  "residual-risks",
  "what-is-excluded",
] as const;

export const SPONSOR_REHEARSAL_SECTION_TITLES: Record<SponsorRehearsalSectionId, string> = {
  "executive-summary": "Executive summary",
  "key-findings-plain-english": "Key findings (plain English)",
  "residual-risks": "Residual risks",
  "what-is-excluded": "What is excluded",
};

export const SPONSOR_REHEARSAL_CAUTION =
  "Preview as sponsor — rehearsal only. Not the signed export packet. Empty sections mean that content is not available on this surface yet.";

const EMPTY_EXECUTIVE =
  "No executive summary or working sponsor synopsis is available yet for this review.";
const EMPTY_FINDINGS =
  "No key findings are available to paraphrase for a sponsor on this surface yet.";
const EMPTY_RESIDUAL =
  "No residual-risk notes were supplied with the findings available here.";
const DEFAULT_EXCLUDED =
  "Operator triage controls, raw evidence payloads, CLI diagnostics, and internal governance job routing are excluded from the sponsor-facing packet.";

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function buildExecutiveSummaryBody(input: SponsorRehearsalPreviewInput): { body: string; isEmpty: boolean } {
  const explicit = nonEmpty(input.executiveSummary);

  if (explicit !== null) {
    return { body: explicit, isEmpty: false };
  }

  const synopsis = nonEmpty(input.synopsisParagraph);

  if (synopsis !== null) {
    const title = nonEmpty(input.packageTitle);
    const prefix = title !== null ? `Working synopsis for "${title}": ` : "";

    return { body: `${prefix}${synopsis}`, isEmpty: false };
  }

  return { body: EMPTY_EXECUTIVE, isEmpty: true };
}

function buildKeyFindingsBody(input: SponsorRehearsalPreviewInput): { body: string; isEmpty: boolean } {
  const findings = input.findings ?? [];

  if (findings.length === 0) {
    return { body: EMPTY_FINDINGS, isEmpty: true };
  }

  const blocks = findings.map((finding, index) => {
    const rewrite = buildSponsorPlainEnglishFinding(finding);

    return `${index + 1}. ${rewrite.headline}\n${rewrite.plainEnglish}`;
  });

  return { body: blocks.join("\n\n"), isEmpty: false };
}

function collectResidualLines(input: SponsorRehearsalPreviewInput): string[] {
  const lines: string[] = [];

  for (const note of input.residualRiskNotes ?? []) {
    const trimmed = nonEmpty(note);

    if (trimmed !== null && !lines.includes(trimmed)) {
      lines.push(trimmed);
    }
  }

  for (const finding of input.findings ?? []) {
    const residual = nonEmpty(finding.residualRisk);

    if (residual !== null && !lines.includes(residual)) {
      lines.push(residual);
    }
  }

  return lines;
}

function buildResidualRisksBody(input: SponsorRehearsalPreviewInput): { body: string; isEmpty: boolean } {
  const lines = collectResidualLines(input);

  if (lines.length === 0) {
    return { body: EMPTY_RESIDUAL, isEmpty: true };
  }

  return { body: lines.map((line) => `• ${line}`).join("\n"), isEmpty: false };
}

function buildExcludedBody(input: SponsorRehearsalPreviewInput): { body: string; isEmpty: boolean } {
  const notes = (input.excludedNotes ?? [])
    .map((note) => nonEmpty(note))
    .filter((note): note is string => note !== null);

  if (notes.length === 0) {
    return { body: DEFAULT_EXCLUDED, isEmpty: false };
  }

  return { body: notes.map((line) => `• ${line}`).join("\n"), isEmpty: false };
}

export type SponsorRehearsalPreview = {
  readonly sections: readonly SponsorRehearsalSection[];
  readonly caution: string;
};

/** Builds the fixed four-section sponsor rehearsal preview. */
export function buildSponsorRehearsalPreview(input: SponsorRehearsalPreviewInput): SponsorRehearsalPreview {
  const builders: Record<SponsorRehearsalSectionId, () => { body: string; isEmpty: boolean }> = {
    "executive-summary": () => buildExecutiveSummaryBody(input),
    "key-findings-plain-english": () => buildKeyFindingsBody(input),
    "residual-risks": () => buildResidualRisksBody(input),
    "what-is-excluded": () => buildExcludedBody(input),
  };

  const sections: SponsorRehearsalSection[] = SPONSOR_REHEARSAL_SECTION_ORDER.map((id) => {
    const built = builders[id]();

    return {
      id,
      title: SPONSOR_REHEARSAL_SECTION_TITLES[id],
      body: built.body,
      isEmpty: built.isEmpty,
    };
  });

  return {
    sections,
    caution: SPONSOR_REHEARSAL_CAUTION,
  };
}

/** Stable section id list for tests and UI anchors. */
export function listSponsorRehearsalSectionIds(): readonly SponsorRehearsalSectionId[] {
  return SPONSOR_REHEARSAL_SECTION_ORDER;
}