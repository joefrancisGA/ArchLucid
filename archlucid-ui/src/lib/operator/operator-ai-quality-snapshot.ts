export type OperatorAiQualitySnapshotDisposition = "PASS" | "WARN" | "NOT_GENERATED";

const OPERATOR_AI_QUALITY_SNAPSHOT_DISPOSITIONS: readonly OperatorAiQualitySnapshotDisposition[] = [
  "PASS",
  "WARN",
  "NOT_GENERATED",
];

function parseOperatorAiQualitySnapshotDisposition(
  value: unknown,
): OperatorAiQualitySnapshotDisposition {
  if (typeof value !== "string") {
    return "NOT_GENERATED";
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === "NOT_GENERATED" || normalized === "NOT GENERATED") {
    return "NOT_GENERATED";
  }

  for (const disposition of OPERATOR_AI_QUALITY_SNAPSHOT_DISPOSITIONS) {
    if (normalized === disposition) {
      return disposition;
    }
  }

  return "NOT_GENERATED";
}

function parseOperatorAiQualityHistoryEntry(value: unknown): OperatorAiQualityHistoryEntry | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const retrievalIr = row.retrievalIr;

  if (retrievalIr === null || typeof retrievalIr !== "object") {
    return null;
  }

  const ir = retrievalIr as Record<string, unknown>;

  return {
    generatedUtc: String(row.generatedUtc ?? ""),
    disposition: parseOperatorAiQualitySnapshotDisposition(row.disposition),
    retrievalIr: {
      casesEvaluated: typeof ir.casesEvaluated === "number" ? ir.casesEvaluated : null,
      meanRecallAt5: typeof ir.meanRecallAt5 === "number" ? ir.meanRecallAt5 : null,
      meanMrr: typeof ir.meanMrr === "number" ? ir.meanMrr : null,
      floorRecallAt5: typeof ir.floorRecallAt5 === "number" ? ir.floorRecallAt5 : null,
      floorMrr: typeof ir.floorMrr === "number" ? ir.floorMrr : null,
    },
  };
}

function parseOperatorAiQualitySnapshot(value: unknown): OperatorAiQualitySnapshot | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const retrievalIr = row.retrievalIr;

  if (retrievalIr === null || typeof retrievalIr !== "object") {
    return null;
  }

  const ir = retrievalIr as Record<string, unknown>;
  const remediationLinksRaw = row.remediationLinks;
  const remediationLinks: { label: string; path: string }[] = [];

  if (Array.isArray(remediationLinksRaw)) {
    for (const link of remediationLinksRaw) {
      if (link === null || typeof link !== "object") {
        continue;
      }

      const linkRow = link as Record<string, unknown>;
      const label = typeof linkRow.label === "string" ? linkRow.label.trim() : "";
      const path = typeof linkRow.path === "string" ? linkRow.path.trim() : "";

      if (label.length > 0 && path.length > 0) {
        remediationLinks.push({ label, path });
      }
    }
  }

  const historyRaw = row.history;
  const history: OperatorAiQualityHistoryEntry[] = [];

  if (Array.isArray(historyRaw)) {
    for (const entry of historyRaw) {
      const parsed = parseOperatorAiQualityHistoryEntry(entry);

      if (parsed !== null) {
        history.push(parsed);
      }
    }
  }

  return {
    generatedUtc: String(row.generatedUtc ?? ""),
    disposition: parseOperatorAiQualitySnapshotDisposition(row.disposition),
    retrievalIr: {
      casesEvaluated: typeof ir.casesEvaluated === "number" ? ir.casesEvaluated : null,
      meanRecallAt5: typeof ir.meanRecallAt5 === "number" ? ir.meanRecallAt5 : null,
      meanMrr: typeof ir.meanMrr === "number" ? ir.meanMrr : null,
      floorRecallAt5: typeof ir.floorRecallAt5 === "number" ? ir.floorRecallAt5 : null,
      floorMrr: typeof ir.floorMrr === "number" ? ir.floorMrr : null,
    },
    ...(history.length > 0 ? { history } : {}),
    remediationLinks,
  };
}

export type OperatorAiQualityHistoryEntry = {
  readonly generatedUtc: string;
  readonly disposition: OperatorAiQualitySnapshotDisposition;
  readonly retrievalIr: OperatorAiQualitySnapshot["retrievalIr"];
};

export type OperatorAiQualitySnapshot = {
  readonly generatedUtc: string;
  readonly disposition: OperatorAiQualitySnapshotDisposition;
  readonly retrievalIr: {
    readonly casesEvaluated: number | null;
    readonly meanRecallAt5: number | null;
    readonly meanMrr: number | null;
    readonly floorRecallAt5: number | null;
    readonly floorMrr: number | null;
  };
  readonly history?: readonly OperatorAiQualityHistoryEntry[];
  readonly remediationLinks: readonly {
    readonly label: string;
    readonly path: string;
  }[];
};

/** Loads the static CI-generated assistant readiness snapshot from the app public folder. */
export async function fetchOperatorAiQualitySnapshot(): Promise<OperatorAiQualitySnapshot | null> {
  try {
    const response = await fetch("/operator-ai-quality-snapshot.json", { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return parseOperatorAiQualitySnapshot(await response.json());
  } catch {
    return null;
  }
}

export function dispositionLabel(disposition: OperatorAiQualitySnapshotDisposition): string {
  switch (disposition) {
    case "PASS":
      return "PASS";
    case "WARN":
      return "WARN";
    case "NOT_GENERATED":
      return "Not generated";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

export function dispositionClass(disposition: OperatorAiQualitySnapshotDisposition): string {
  switch (disposition) {
    case "PASS":
      return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700";
    case "WARN":
      return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
    case "NOT_GENERATED":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}
