import type { HeldCheckInputCode } from "@/lib/quality/held-check-input-code";

export type HeldCheckLedgerRollupEntry = {
  readonly inputCode: HeldCheckInputCode;
  readonly engineCount: number;
  readonly engineTypes: readonly string[];
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

function readStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/** Reads held-check rollup persisted on findings snapshot curation (DX-52). */
export function readHeldCheckLedgerFromFindingsSnapshot(findingsSnapshot: unknown): readonly HeldCheckLedgerRollupEntry[] {
  if (findingsSnapshot === null || typeof findingsSnapshot !== "object") {
    return [];
  }

  const curation = (findingsSnapshot as { insightDensityCuration?: unknown }).insightDensityCuration;

  if (curation === null || typeof curation !== "object") {
    return [];
  }

  const rawEntries = (curation as { heldCheckLedgerEntries?: unknown }).heldCheckLedgerEntries;

  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const entries: HeldCheckLedgerRollupEntry[] = [];

  for (const rawEntry of rawEntries) {
    if (rawEntry === null || typeof rawEntry !== "object") {
      continue;
    }

    const inputCodeRaw = (rawEntry as { inputCode?: unknown }).inputCode;
    const engineCountRaw = (rawEntry as { engineCount?: unknown }).engineCount;

    if (typeof inputCodeRaw !== "string" || !isHeldCheckInputCode(inputCodeRaw)) {
      continue;
    }

    const engineCount =
      typeof engineCountRaw === "number" && Number.isFinite(engineCountRaw)
        ? Math.max(0, Math.trunc(engineCountRaw))
        : 0;

    if (engineCount <= 0) {
      continue;
    }

    entries.push({
      inputCode: inputCodeRaw,
      engineCount,
      engineTypes: readStringArray((rawEntry as { engineTypes?: unknown }).engineTypes),
    });
  }

  return entries;
}
