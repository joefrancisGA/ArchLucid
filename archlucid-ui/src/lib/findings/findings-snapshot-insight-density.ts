import type { RunDetail } from "@/types/authority";

export type ChecklistCoverageItem = {
  readonly findingId: string;
  readonly title: string;
  readonly category: string | null;
  readonly recommendation: string | null;
};

export type InsightDensityCurationCounts = {
  readonly demotedToChecklistCount: number;
  readonly retainedFindingCount: number;
};

export type FindingsSnapshotInsightDensityView = {
  readonly checklistCoverage: readonly ChecklistCoverageItem[];
  readonly curation: InsightDensityCurationCounts | null;
};

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function readNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  return null;
}

function readFindingTitle(record: Record<string, unknown>): string {
  const message = typeof record.message === "string" ? record.message.trim() : "";

  if (message.length > 0) {
    return message;
  }

  const category = typeof record.category === "string" ? record.category.trim() : "";

  if (category.length > 0) {
    return category;
  }

  const findingType = typeof record.findingType === "string" ? record.findingType.trim() : "";

  if (findingType.length > 0) {
    return findingType;
  }

  const findingId = typeof record.findingId === "string" ? record.findingId.trim() : "";

  if (findingId.length > 0) {
    return findingId;
  }

  return "Checklist observation";
}

/** Parses TB-384 checklist rows and TB-385 curation counts from hydrated run detail `findingsSnapshot`. */
export function resolveFindingsSnapshotInsightDensityView(detail: RunDetail): FindingsSnapshotInsightDensityView {
  const snapshot = readRecord((detail as Record<string, unknown>).findingsSnapshot);

  if (snapshot === null) {
    return { checklistCoverage: [], curation: null };
  }

  const checklistRaw = snapshot.checklistCoverage;
  const checklistCoverage: ChecklistCoverageItem[] = [];

  if (Array.isArray(checklistRaw)) {
    for (const item of checklistRaw) {
      const record = readRecord(item);

      if (record === null) {
        continue;
      }

      const findingId = typeof record.findingId === "string" ? record.findingId.trim() : "";

      if (findingId.length === 0) {
        continue;
      }

      const reasoning =
        typeof record.reasoningTrace === "string" && record.reasoningTrace.trim().length > 0
          ? record.reasoningTrace.trim()
          : null;

      checklistCoverage.push({
        findingId,
        title: readFindingTitle(record),
        category:
          typeof record.category === "string" && record.category.trim().length > 0 ? record.category.trim() : null,
        recommendation: reasoning,
      });
    }
  }

  const curationRaw = readRecord(snapshot.insightDensityCuration);
  let curation: InsightDensityCurationCounts | null = null;

  if (curationRaw !== null) {
    const demoted = readNonNegativeInt(curationRaw.demotedToChecklistCount);
    const retained = readNonNegativeInt(curationRaw.retainedFindingCount);

    if (demoted !== null || retained !== null) {
      curation = {
        demotedToChecklistCount: demoted ?? checklistCoverage.length,
        retainedFindingCount: retained ?? 0,
      };
    }
  }

  if (curation === null && checklistCoverage.length > 0) {
    curation = {
      demotedToChecklistCount: checklistCoverage.length,
      retainedFindingCount: 0,
    };
  }

  return { checklistCoverage, curation };
}

/**
 * True when the coverage/curation disclosure has something to show — either checklist rows or a
 * non-empty curation message. Mirrors the child components' own null guards so callers can drop
 * the surrounding disclosure heading instead of rendering an empty one.
 */
export function hasFindingsSnapshotInsightDensityContent(
  view: FindingsSnapshotInsightDensityView,
): boolean {
  if (view.checklistCoverage.length > 0) {
    return true;
  }

  if (view.curation === null) {
    return false;
  }

  return formatInsightDensityCurationMessage(view.curation).length > 0;
}

/** Buyer-facing curation copy for TB-385 banner (empty when there is nothing to communicate). */
export function formatInsightDensityCurationMessage(curation: InsightDensityCurationCounts): string {
  const demoted = curation.demotedToChecklistCount;
  const retained = curation.retainedFindingCount;
  const typedEngineLead =
    "Typed-engine findings stay on the package regardless of insight-density score (typed-engine-protected).";

  if (demoted <= 0 && retained <= 0) {
    return "";
  }

  if (demoted > 0 && retained > 0) {
    return `${typedEngineLead} ArchLucid moved ${demoted} low-specificity ${demoted === 1 ? "advisory" : "advisories"} to the coverage checklist and retained ${retained} decision-grade ${retained === 1 ? "finding" : "findings"} on this package.`;
  }

  if (demoted > 0) {
    return `${typedEngineLead} ArchLucid moved ${demoted} low-specificity ${demoted === 1 ? "observation" : "observations"} to the coverage checklist (not decision-grade findings on this package).`;
  }

  return `${typedEngineLead} ArchLucid retained ${retained} decision-grade ${retained === 1 ? "finding" : "findings"} after insight-density curation.`;
}
