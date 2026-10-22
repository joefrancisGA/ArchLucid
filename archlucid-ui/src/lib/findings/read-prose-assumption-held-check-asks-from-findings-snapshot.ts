import type { HeldCheckInputCode } from "@/lib/quality/held-check-input-code";

export type ProseAssumptionHeldCheckAsk = {
  readonly inputCode: HeldCheckInputCode;
  readonly statement: string;
  readonly evidenceRef: string;
};

const HELD_CHECK_INPUT_CODES: readonly HeldCheckInputCode[] = [
  "azureInventoryZip",
  "awsInventoryZip",
  "gcpInventoryZip",
  "actorNodes",
  "rbacBindings",
  "secretRotationMetadata",
  "replicaOrFailoverProperties",
  "networkPolicyRules",
  "priorRunSnapshot",
  "assignedPolicyPack",
];

function isHeldCheckInputCode(value: string): value is HeldCheckInputCode {
  return (HELD_CHECK_INPUT_CODES as readonly string[]).includes(value);
}

export function readProseAssumptionHeldCheckAsksFromFindingsSnapshot(
  findingsSnapshot: unknown,
): readonly ProseAssumptionHeldCheckAsk[] {
  if (findingsSnapshot === null || findingsSnapshot === undefined || typeof findingsSnapshot !== "object") {
    return [];
  }

  const curation = (findingsSnapshot as { insightDensityCuration?: unknown }).insightDensityCuration;

  if (curation === null || curation === undefined || typeof curation !== "object") {
    return [];
  }

  const rawAsks = (curation as { proseAssumptionHeldCheckAsks?: unknown }).proseAssumptionHeldCheckAsks;

  if (!Array.isArray(rawAsks)) {
    return [];
  }

  const asks: ProseAssumptionHeldCheckAsk[] = [];

  for (const rawAsk of rawAsks) {
    if (rawAsk === null || rawAsk === undefined || typeof rawAsk !== "object") {
      continue;
    }

    const inputCodeRaw = (rawAsk as { inputCode?: unknown }).inputCode;
    const statementRaw = (rawAsk as { statement?: unknown }).statement;
    const evidenceRefRaw = (rawAsk as { evidenceRef?: unknown }).evidenceRef;

    if (typeof inputCodeRaw !== "string" || !isHeldCheckInputCode(inputCodeRaw)) {
      continue;
    }

    if (typeof statementRaw !== "string" || statementRaw.trim().length === 0) {
      continue;
    }

    asks.push({
      inputCode: inputCodeRaw,
      statement: statementRaw,
      evidenceRef: typeof evidenceRefRaw === "string" ? evidenceRefRaw : "",
    });
  }

  return asks;
}
