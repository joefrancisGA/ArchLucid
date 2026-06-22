import type { FindingProvenance, FindingProvenanceStep } from "@/lib/api/finding-provenance";
import type { FindingInspectEvidence, FindingInspectPayload } from "@/types/finding-inspect";
import type { FindingLlmAudit } from "@/types/explanation";

export type FindingRawContextBlockKind =
  | "cited-evidence"
  | "provenance-input"
  | "provenance-evidence"
  | "llm-user-prompt";

export type FindingRawContextBlock = {
  readonly id: string;
  readonly kind: FindingRawContextBlockKind;
  readonly title: string;
  readonly body: string;
  readonly meta: string | null;
};

function citedEvidenceBlock(row: FindingInspectEvidence, index: number): FindingRawContextBlock | null {
  const excerpt = row.excerpt?.trim() ?? "";

  if (excerpt.length === 0) {
    return null;
  }

  const metaParts: string[] = [];

  if (row.artifactId?.trim()) {
    metaParts.push(`Artifact: ${row.artifactId.trim()}`);
  }

  if (row.lineRange?.trim()) {
    metaParts.push(`Lines: ${row.lineRange.trim()}`);
  }

  return {
    id: `cited-evidence-${index}`,
    kind: "cited-evidence",
    title: "Cited evidence excerpt",
    body: excerpt,
    meta: metaParts.length > 0 ? metaParts.join(" · ") : null,
  };
}

function provenanceStepBlock(step: FindingProvenanceStep, index: number): FindingRawContextBlock | null {
  if (step.kind !== "input" && step.kind !== "evidence") {
    return null;
  }

  const detail = step.detail?.trim() ?? "";

  if (detail.length === 0) {
    return null;
  }

  return {
    id: `provenance-${step.kind}-${index}`,
    kind: step.kind === "input" ? "provenance-input" : "provenance-evidence",
    title: step.kind === "input" ? `Brief context: ${step.label}` : `Evidence: ${step.label}`,
    body: detail,
    meta: null,
  };
}

function llmUserPromptBlock(audit: FindingLlmAudit | null): FindingRawContextBlock | null {
  if (audit === null) {
    return null;
  }

  const body = audit.userPromptRedacted?.trim() ?? "";

  if (body.length === 0) {
    return null;
  }

  return {
    id: "llm-user-prompt",
    kind: "llm-user-prompt",
    title: "LLM user prompt (redacted)",
    body,
    meta: `Trace ${audit.traceId} · Model ${audit.modelDeploymentName?.trim() ? audit.modelDeploymentName : "—"}`,
  };
}

/** Merges inspect citations, provenance evidence steps, and redacted LLM user prompt into debug blocks. */
export function buildFindingRawContextBlocks(
  inspectPayload: FindingInspectPayload | null,
  provenance: FindingProvenance | null,
  llmAudit: FindingLlmAudit | null,
): readonly FindingRawContextBlock[] {
  const blocks: FindingRawContextBlock[] = [];

  if (inspectPayload !== null) {
    inspectPayload.evidence.forEach((row, index) => {
      const block = citedEvidenceBlock(row, index);

      if (block !== null) {
        blocks.push(block);
      }
    });
  }

  if (provenance !== null) {
    provenance.steps.forEach((step, index) => {
      const block = provenanceStepBlock(step, index);

      if (block !== null) {
        blocks.push(block);
      }
    });
  }

  const promptBlock = llmUserPromptBlock(llmAudit);

  if (promptBlock !== null) {
    blocks.push(promptBlock);
  }

  return blocks;
}
