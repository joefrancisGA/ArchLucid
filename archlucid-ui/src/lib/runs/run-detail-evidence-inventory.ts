import { normalizeEvidenceRefSnippet } from "@/lib/findings/finding-evidence-ref-snippet";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { TrustEvidenceReadiness, TrustEvidenceReadinessVerdict } from "@/lib/trust-evidence-readiness";

export type RunDetailEvidenceInventoryKind = "stored-file" | "architecture-brief" | "citation";

export type RunStoredEvidenceCatalogEntry = {
  readonly evidenceItemId: string;
  readonly originalFileName: string;
  readonly contentType?: string;
  readonly createdUtc?: string;
};

export const RUN_DETAIL_EVIDENCE_KIND_NOT_STORED = "Evidence kind was not stored." as const;

export const FINDINGS_CITE_EVIDENCE_WITHOUT_SOURCE_NAMES_HEADLINE =
  "Findings cite evidence, but source names were not stored." as const;

export type RunDetailEvidenceInventoryItem = {
  readonly key: string;
  readonly sourceName: string;
  /** Buyer-facing category label (Document, Architecture brief, …). */
  readonly kind: string;
  /** Whether the row can be opened from stored bytes (ESI-01 inspect ladder). */
  readonly inventoryKind: RunDetailEvidenceInventoryKind;
  /** Set when inventoryKind is stored-file. */
  readonly evidenceItemId: string | null;
  readonly ingestedUtc: string | null;
  readonly citingFindingCount: number;
};

const ARCHITECTURE_BRIEF_KEY = "__architecture-brief__";

function resolveIngestedUtcForEvidenceItem(
  evidenceItemId: string | null,
  catalog: readonly RunStoredEvidenceCatalogEntry[] | undefined,
): string | null {
  if (evidenceItemId === null || catalog === undefined) {
    return null;
  }

  const entry = catalog.find((row) => row.evidenceItemId === evidenceItemId);
  const createdUtc = entry?.createdUtc?.trim() ?? "";

  return createdUtc.length > 0 ? createdUtc : null;
}

function inferEvidenceKind(sourceName: string): string {
  const lower = sourceName.toLowerCase();

  if (lower.includes(".bicep") || lower.includes(".tf") || lower.includes("terraform")) {
    return "Infrastructure as code";
  }

  if (lower.includes("inventory")) {
    return "Submitted evidence";
  }

  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    return RUN_DETAIL_EVIDENCE_KIND_NOT_STORED;
  }

  return "Document";
}

export function findingsCiteEvidenceWithoutStoredSourceNames(
  findings: readonly QuickDecisionFinding[],
): boolean {
  return findings.some((finding) => {
    const refCount = finding.evidenceRefCount;
    const snippets = finding.evidenceRefSnippets ?? [];

    return typeof refCount === "number" && Number.isFinite(refCount) && refCount > 0 && snippets.length === 0;
  });
}

function extractSourceName(snippet: string): string {
  const leadingClause = snippet.split(/[—–]/)[0]?.trim() ?? snippet;
  const beforeColon = leadingClause.split(":")[0]?.trim() ?? leadingClause;

  return beforeColon.length > 0 ? beforeColon : snippet;
}

type InventoryRowAccumulator = {
  readonly sourceName: string;
  readonly kind: string;
  readonly inventoryKind: RunDetailEvidenceInventoryKind;
  readonly evidenceItemId: string | null;
  readonly findingIds: Set<string>;
};

function resolveStoredEvidenceCatalogMatch(
  sourceName: string,
  catalog: readonly RunStoredEvidenceCatalogEntry[] | undefined,
): { readonly evidenceItemId: string } | null {
  if (catalog === undefined || catalog.length === 0) {
    return null;
  }

  const normalizedSource = sourceName.trim().toLowerCase();
  const fileNameMatches = catalog.filter(
    (entry) => entry.originalFileName.trim().toLowerCase() === normalizedSource,
  );

  if (fileNameMatches.length === 1) {
    return { evidenceItemId: fileNameMatches[0]!.evidenceItemId };
  }

  const idMatches = catalog.filter((entry) => entry.evidenceItemId === sourceName.trim());

  if (idMatches.length === 1) {
    return { evidenceItemId: idMatches[0]!.evidenceItemId };
  }

  return null;
}

function resolveInventoryKindForSourceName(
  sourceName: string,
  catalog: readonly RunStoredEvidenceCatalogEntry[] | undefined,
  architectureBrief: boolean,
): Pick<InventoryRowAccumulator, "inventoryKind" | "evidenceItemId"> {
  if (architectureBrief) {
    return { inventoryKind: "architecture-brief", evidenceItemId: null };
  }

  const catalogMatch = resolveStoredEvidenceCatalogMatch(sourceName, catalog);

  if (catalogMatch !== null) {
    return { inventoryKind: "stored-file", evidenceItemId: catalogMatch.evidenceItemId };
  }

  return { inventoryKind: "citation", evidenceItemId: null };
}

function addInventoryRow(
  map: Map<string, InventoryRowAccumulator>,
  key: string,
  sourceName: string,
  kind: string,
  inventoryKind: RunDetailEvidenceInventoryKind,
  evidenceItemId: string | null,
  findingId: string,
): void {
  const existing = map.get(key);

  if (existing) {
    existing.findingIds.add(findingId);

    return;
  }

  map.set(key, {
    sourceName,
    kind,
    inventoryKind,
    evidenceItemId,
    findingIds: new Set([findingId]),
  });
}

export function deriveRunDetailEvidenceInventory(input: {
  readonly findings: readonly QuickDecisionFinding[];
  readonly runCreatedUtc: string;
  readonly submittedArchitecturePresent: boolean;
  readonly attachedFileNames?: readonly string[];
  readonly storedEvidenceCatalog?: readonly RunStoredEvidenceCatalogEntry[];
}): RunDetailEvidenceInventoryItem[] {
  const map = new Map<string, InventoryRowAccumulator>();

  if (input.submittedArchitecturePresent) {
    map.set(ARCHITECTURE_BRIEF_KEY, {
      sourceName: "Submitted architecture brief",
      kind: "Architecture brief",
      inventoryKind: "architecture-brief",
      evidenceItemId: null,
      findingIds: new Set(),
    });
  }

  for (const rawName of input.attachedFileNames ?? []) {
    const sourceName = rawName.trim();

    if (sourceName.length === 0) {
      continue;
    }

    const key = sourceName.toLowerCase();

    if (map.has(key)) {
      continue;
    }

    const inspectKind = resolveInventoryKindForSourceName(
      sourceName,
      input.storedEvidenceCatalog,
      false,
    );

    map.set(key, {
      sourceName,
      kind: inferEvidenceKind(sourceName),
      inventoryKind: inspectKind.inventoryKind,
      evidenceItemId: inspectKind.evidenceItemId,
      findingIds: new Set(),
    });
  }

  for (const finding of input.findings) {
    const snippets = finding.evidenceRefSnippets ?? [];
    const refCount = finding.evidenceRefCount;

    if (
      snippets.length === 0
      && typeof refCount === "number"
      && Number.isFinite(refCount)
      && refCount > 0
    ) {
      continue;
    }

    for (const raw of snippets) {
      const snippet = normalizeEvidenceRefSnippet(raw) ?? raw.trim();

      if (snippet.length === 0) {
        continue;
      }

      const sourceName = extractSourceName(snippet);
      const key = sourceName.toLowerCase();
      const inspectKind = resolveInventoryKindForSourceName(
        sourceName,
        input.storedEvidenceCatalog,
        false,
      );

      addInventoryRow(
        map,
        key,
        sourceName,
        RUN_DETAIL_EVIDENCE_KIND_NOT_STORED,
        inspectKind.inventoryKind,
        inspectKind.evidenceItemId,
        finding.findingId,
      );
    }
  }

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      sourceName: value.sourceName,
      kind: value.kind,
      inventoryKind: value.inventoryKind,
      evidenceItemId: value.evidenceItemId,
      ingestedUtc: resolveIngestedUtcForEvidenceItem(value.evidenceItemId, input.storedEvidenceCatalog),
      citingFindingCount: value.findingIds.size,
    }))
    .sort((left, right) => left.sourceName.localeCompare(right.sourceName, undefined, { sensitivity: "base" }));
}

export function countRunDetailEvidenceInventoryItems(
  items: readonly RunDetailEvidenceInventoryItem[],
): number {
  return items.length;
}

export type EvidenceScopeCoverageInput = {
  readonly inventoryCount: number;
  readonly findingsCoverageSummaryLine: string;
  readonly linkedFindingCount: number;
  readonly openFindingCount: number;
};

/** Coverage copy for the Evidence tab header — never implies satisfied coverage when inventory is empty. */
export function deriveEvidenceScopeCoverageLine(input: EvidenceScopeCoverageInput): string {
  if (input.inventoryCount > 0) {
    return input.findingsCoverageSummaryLine;
  }

  if (input.openFindingCount > 0 && input.linkedFindingCount > 0) {
    const linkedCount = input.linkedFindingCount;
    const findingNoun = linkedCount === 1 ? "finding cites" : "findings cite";

    return `${linkedCount} open ${findingNoun} internal finding pointers — no submitted source documents are listed.`;
  }

  return "No submitted source documents are listed for this review.";
}

/** Single Evidence-tab readiness verdict — inventory gaps override a complete trust-evidence rollup. */
export function deriveEvidenceScopeReadiness(input: {
  readonly inventoryCount: number;
  readonly trustReadiness: TrustEvidenceReadiness | null;
  readonly findingsCiteEvidenceWithoutSourceNames?: boolean;
}): { readonly verdict: TrustEvidenceReadinessVerdict; readonly headline: string } {
  if (input.findingsCiteEvidenceWithoutSourceNames === true) {
    return {
      verdict: "gaps",
      headline: FINDINGS_CITE_EVIDENCE_WITHOUT_SOURCE_NAMES_HEADLINE,
    };
  }

  if (input.inventoryCount === 0) {

    if (input.trustReadiness !== null && input.trustReadiness.verdict === "gaps") {
      return {
        verdict: "gaps",
        headline: input.trustReadiness.headline,
      };
    }

    return {
      verdict: "gaps",
      headline: "Submitted evidence inventory is empty.",
    };
  }

  if (input.trustReadiness !== null) {
    return {
      verdict: input.trustReadiness.verdict,
      headline: input.trustReadiness.headline,
    };
  }

  return {
    verdict: "gaps",
    headline: "Trust evidence was not stored.",
  };
}
