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

const DOMAIN_LABELS: Record<FindingCoverageDomain, string> = {
  cost: "cost",
  resilience: "resilience",
  security: "security",
  decisions: "architecture decisions",
};

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

function missingEntries(flags: EvidencePresenceFlags): EvidenceGapForecastEntry[] {
  const checks: readonly { readonly flag: keyof EvidencePresenceFlags; readonly classId: EvidenceGapClass }[] = [
    { flag: "hasArchitectureBrief", classId: "architecture-brief" },
    { flag: "hasCloudInventory", classId: "cloud-inventory" },
    { flag: "hasInfrastructureAsCode", classId: "infrastructure-as-code" },
    { flag: "hasArchitectureDiagram", classId: "architecture-diagram" },
    { flag: "hasOperationalEvidence", classId: "operational-evidence" },
  ];

  return checks
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

export function formatEvidenceGapForecastHeadline(entry: EvidenceGapForecastEntry): string {
  const domains = formatThinnerDomains(entry.thinnerDomains);

  return `Without ${entry.label.toLowerCase()}, expect thinner ${domains} findings.`;
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
