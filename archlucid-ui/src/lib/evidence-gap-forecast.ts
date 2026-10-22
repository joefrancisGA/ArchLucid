export type EvidenceGapClass =
  | "architecture-brief"
  | "cloud-inventory"
  | "infrastructure-as-code"
  | "architecture-diagram"
  | "operational-evidence";

export type FindingCoverageDomain = "cost" | "resilience" | "security" | "decisions";

export type EvidencePresenceFlags = {
  readonly hasArchitectureBrief: boolean;
  readonly hasCloudInventory: boolean;
  readonly hasInfrastructureAsCode: boolean;
  readonly hasArchitectureDiagram: boolean;
  readonly hasOperationalEvidence: boolean;
};

export type EvidenceGapForecastEntry = {
  readonly missingClass: EvidenceGapClass;
  readonly label: string;
  readonly thinnerDomains: readonly FindingCoverageDomain[];
  readonly guidance: string;
};

export const EVIDENCE_GAP_FORECAST_DISCLAIMER =
  "Directional coverage expectation only — not a guarantee of finding counts or severities.";

export const EVIDENCE_GAP_FORECAST_PANEL_TITLE = "Expected finding coverage";

/** Deep link to the reference section on `/help/evidence-intake`. */
export const EVIDENCE_COVERAGE_HELP_HREF = "/help/evidence-intake#finding-coverage";

export const EVIDENCE_COVERAGE_HELP_LINK_LABEL = "How evidence affects coverage";

/** Summary line when only generic architecture documents are attached (docx/pdf), not specialist evidence. */
export const EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_SUMMARY =
  "Architecture document attached — specialist evidence can still strengthen finding coverage.";

/** Intro copy above per-class rows when a generic document may already cover some missing classes. */
export const EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_DETAIL_INTRO =
  "The attached document may already cover some topics; the rows below show where specialist evidence can still strengthen findings.";

const DOMAIN_LABELS: Record<FindingCoverageDomain, string> = {
  cost: "cost",
  resilience: "resilience",
  security: "security",
  decisions: "architecture decisions",
};

/** Canonical domain order so summary copy stays stable regardless of which classes are missing. */
const DOMAIN_ORDER: readonly FindingCoverageDomain[] = ["cost", "resilience", "security", "decisions"];

const FORECAST_BY_CLASS: Record<
  EvidenceGapClass,
  { readonly label: string; readonly domains: readonly FindingCoverageDomain[]; readonly guidance: string }
> = {
  "architecture-brief": {
    label: "Architecture brief",
    domains: ["decisions", "security", "resilience"],
    guidance: "Add a short architecture brief so decision and risk findings have narrative context.",
  },
  "cloud-inventory": {
    label: "Cloud inventory",
    domains: ["cost", "resilience", "security"],
    guidance: "Upload a cloud inventory export so cost and posture findings can anchor to live resources.",
  },
  "infrastructure-as-code": {
    label: "Infrastructure as code",
    domains: ["cost", "resilience", "security"],
    guidance: "Attach infrastructure-as-code so configuration and drift findings can cite concrete definitions.",
  },
  "architecture-diagram": {
    label: "Architecture diagram",
    domains: ["resilience", "decisions", "security"],
    guidance: "Add a diagram or topology snapshot so boundary and dependency findings can reference structure.",
  },
  "operational-evidence": {
    label: "Operational evidence",
    domains: ["resilience", "security"],
    guidance: "Add runbooks, monitoring, or incident notes so operational resilience findings are less generic.",
  },
};

function formatThinnerDomains(domains: readonly FindingCoverageDomain[]): string {
  const labels = domains.map((domain) => DOMAIN_LABELS[domain]);

  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0] ?? "";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/** Presentation order for every evidence class, shared by the forecast, the summary, and the help table. */
const EVIDENCE_CLASS_ORDER: readonly {
  readonly flag: keyof EvidencePresenceFlags;
  readonly classId: EvidenceGapClass;
}[] = [
  { flag: "hasArchitectureBrief", classId: "architecture-brief" },
  { flag: "hasCloudInventory", classId: "cloud-inventory" },
  { flag: "hasInfrastructureAsCode", classId: "infrastructure-as-code" },
  { flag: "hasArchitectureDiagram", classId: "architecture-diagram" },
  { flag: "hasOperationalEvidence", classId: "operational-evidence" },
];

export const EVIDENCE_COVERAGE_CLASS_COUNT: number = EVIDENCE_CLASS_ORDER.length;

function missingEntries(flags: EvidencePresenceFlags): EvidenceGapForecastEntry[] {
  return EVIDENCE_CLASS_ORDER
    .filter((entry) => !flags[entry.flag])
    .map((entry) => {
      const forecast = FORECAST_BY_CLASS[entry.classId];

      return {
        missingClass: entry.classId,
        label: forecast.label,
        thinnerDomains: forecast.domains,
        guidance: forecast.guidance,
      };
    });
}

/** TB-2177: deterministic forecast from missing evidence classes — buyer-safe, no invented scores. */
export function deriveEvidenceGapForecast(flags: EvidencePresenceFlags): readonly EvidenceGapForecastEntry[] {
  return missingEntries(flags);
}

export type FormatEvidenceGapForecastHeadlineOptions = {
  readonly documentAttachedContext?: boolean;
};

export function formatEvidenceGapForecastHeadline(
  entry: EvidenceGapForecastEntry,
  options?: FormatEvidenceGapForecastHeadlineOptions,
): string {
  const domains = formatThinnerDomains(entry.thinnerDomains);

  if (options?.documentAttachedContext === true) {
    return `${entry.label} can still strengthen ${domains} findings.`;
  }

  return `Without ${entry.label.toLowerCase()}, expect thinner ${domains} findings.`;
}

export type EvidenceCoverageSummary = {
  readonly presentCount: number;
  readonly totalCount: number;
  readonly missingCount: number;
  /** Union of the domains every missing class would thin, in canonical order. */
  readonly thinnerDomains: readonly FindingCoverageDomain[];
  /** True when generic document-only uploads use softer copy instead of an X-of-5 count. */
  readonly usesDocumentAttachedSummary: boolean;
  /** Single-line status suitable for a disclosure summary row or an inline helper line. */
  readonly summaryLine: string;
};

export type DocumentAttachedCoverageInput = {
  readonly attachmentFileNames: readonly string[];
  readonly presence: EvidencePresenceFlags;
  readonly architectureContextPresent?: boolean;
};

export type SummarizeEvidenceCoverageOptions = {
  readonly attachmentFileNames?: readonly string[];
  readonly architectureContextPresent?: boolean;
};

function unionThinnerDomains(
  forecast: readonly EvidenceGapForecastEntry[],
): readonly FindingCoverageDomain[] {
  const affected = new Set<FindingCoverageDomain>(forecast.flatMap((entry) => entry.thinnerDomains));

  return DOMAIN_ORDER.filter((domain) => affected.has(domain));
}

function formatEvidenceCoverageSummaryLine(
  presentCount: number,
  thinnerDomains: readonly FindingCoverageDomain[],
): string {
  if (thinnerDomains.length === 0) {
    return `All ${EVIDENCE_COVERAGE_CLASS_COUNT} evidence classes present — no expected coverage gaps.`;
  }

  return `${presentCount} of ${EVIDENCE_COVERAGE_CLASS_COUNT} evidence classes present — expect thinner ${formatThinnerDomains(thinnerDomains)} findings.`;
}

function isGenericArchitectureDocumentFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  return lower.endsWith(".docx") || lower.endsWith(".pdf") || lower.endsWith(".doc");
}

function fileNameImpliesSpecialistEvidenceClass(fileName: string): boolean {
  const implied = fileNameImpliesClass(fileName);

  return implied !== null && implied !== "architecture-brief";
}

/** True when only generic architecture documents are attached — avoids a misleading 0-of-5 count. */
export function usesDocumentAttachedCoverageSummary(input: DocumentAttachedCoverageInput): boolean {

  if (input.architectureContextPresent === true) {
    return false;
  }

  if (input.attachmentFileNames.length === 0) {
    return false;
  }

  const hasGenericDocument = input.attachmentFileNames.some(isGenericArchitectureDocumentFileName);

  if (!hasGenericDocument) {
    return false;
  }

  const hasSpecialistAttachment = input.attachmentFileNames.some(fileNameImpliesSpecialistEvidenceClass);

  if (hasSpecialistAttachment) {
    return false;
  }

  return true;
}

/**
 * Condenses the per-class forecast into one sentence so surfaces can lead with coverage state
 * and keep the per-class detail behind progressive disclosure.
 */
export function summarizeEvidenceCoverage(
  flags: EvidencePresenceFlags,
  options?: SummarizeEvidenceCoverageOptions,
): EvidenceCoverageSummary {
  const attachmentFileNames = options?.attachmentFileNames ?? [];
  const usesDocumentAttachedSummary = usesDocumentAttachedCoverageSummary({
    attachmentFileNames,
    presence: flags,
    architectureContextPresent: options?.architectureContextPresent,
  });
  const forecast = deriveEvidenceGapForecast(flags);
  const missingCount = forecast.length;
  const presentCount = EVIDENCE_COVERAGE_CLASS_COUNT - missingCount;
  const thinnerDomains = unionThinnerDomains(forecast);
  const summaryLine = usesDocumentAttachedSummary
    ? EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_SUMMARY
    : formatEvidenceCoverageSummaryLine(presentCount, thinnerDomains);

  return {
    presentCount,
    totalCount: EVIDENCE_COVERAGE_CLASS_COUNT,
    missingCount,
    thinnerDomains,
    usesDocumentAttachedSummary,
    summaryLine,
  };
}

export type EvidenceCoverageReferenceRow = {
  readonly classId: EvidenceGapClass;
  readonly label: string;
  /** Domains this class strengthens, already formatted for display. */
  readonly strengthens: string;
  readonly guidance: string;
};

/** Reference table backing `/help/evidence-intake#finding-coverage`, from the same map the panel uses. */
export function listEvidenceCoverageReferenceRows(): readonly EvidenceCoverageReferenceRow[] {
  return EVIDENCE_CLASS_ORDER.map((entry) => {
    const forecast = FORECAST_BY_CLASS[entry.classId];

    return {
      classId: entry.classId,
      label: forecast.label,
      strengthens: formatThinnerDomains(forecast.domains),
      guidance: forecast.guidance,
    };
  });
}

function fileNameImpliesClass(fileName: string): EvidenceGapClass | null {
  const lower = fileName.toLowerCase();

  if (lower.includes("inventory") || lower.endsWith(".zip")) {
    return "cloud-inventory";
  }

  if (lower.includes(".bicep") || lower.includes(".tf") || lower.includes("terraform")) {
    return "infrastructure-as-code";
  }

  if (lower.includes("diagram") || lower.endsWith(".png") || lower.endsWith(".svg") || lower.includes("drawio")) {
    return "architecture-diagram";
  }

  if (
    lower.includes("runbook")
    || lower.includes("monitor")
    || lower.includes("incident")
    || lower.includes("slo")
  ) {
    return "operational-evidence";
  }

  if (lower.endsWith(".md") || lower.includes("brief")) {
    return "architecture-brief";
  }

  if (lower.endsWith(".docx") || lower.endsWith(".pdf") || lower.endsWith(".doc")) {
    return "architecture-brief";
  }

  return null;
}

export function deriveEvidencePresenceFromFileNames(fileNames: readonly string[]): EvidencePresenceFlags {
  const classes = new Set<EvidenceGapClass>();

  for (const fileName of fileNames) {
    const implied = fileNameImpliesClass(fileName);

    if (implied !== null) {
      classes.add(implied);
    }
  }

  return {
    hasArchitectureBrief: classes.has("architecture-brief"),
    hasCloudInventory: classes.has("cloud-inventory"),
    hasInfrastructureAsCode: classes.has("infrastructure-as-code"),
    hasArchitectureDiagram: classes.has("architecture-diagram"),
    hasOperationalEvidence: classes.has("operational-evidence"),
  };
}

export function deriveEvidencePresenceFromInventoryKinds(input: {
  readonly inventoryKinds: readonly string[];
  readonly submittedArchitecturePresent: boolean;
}): EvidencePresenceFlags {
  const normalizedKinds = input.inventoryKinds.map((kind) => kind.toLowerCase());

  return {
    hasArchitectureBrief:
      input.submittedArchitecturePresent
      || normalizedKinds.some((kind) => kind.includes("brief") || kind.includes("document")),
    hasCloudInventory: normalizedKinds.some((kind) => kind.includes("cloud inventory") || kind.includes("inventory")),
    hasInfrastructureAsCode: normalizedKinds.some((kind) => kind.includes("infrastructure as code")),
    hasArchitectureDiagram: normalizedKinds.some((kind) => kind.includes("diagram") || kind.includes("snapshot")),
    hasOperationalEvidence: normalizedKinds.some(
      (kind) => kind.includes("runbook") || kind.includes("operational") || kind.includes("monitor"),
    ),
  };
}
