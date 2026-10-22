import {
  type EvidenceGapClass,
  type EvidencePresenceFlags,
} from "@/lib/evidence-gap-forecast";
import { FIRST_PILOT_MIN_BRIEF_CHARS } from "@/lib/first-pilot-intake";

export type QuickStartAnalyzableEvidenceInput = {
  /** Operator-typed context only — never generated intake boilerplate. */
  readonly operatorBrief: string;
  readonly evidenceFileNames: readonly string[];
  readonly limitedEvidenceAnalysisAcknowledged: boolean;
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"] as const;

function fileNameImpliesQuickStartClass(fileName: string): EvidenceGapClass | null {
  const lower = fileName.toLowerCase();

  if (lower.includes("inventory")) {
    return "cloud-inventory";
  }

  if (lower.includes(".bicep") || lower.includes(".tf") || lower.includes("terraform")) {
    return "infrastructure-as-code";
  }

  if (
    lower.includes("diagram")
    || lower.includes("topology")
    || lower.includes("drawio")
    || lower.includes("architecture")
  ) {
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

  const isImageOnly = IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension));

  if (isImageOnly) {
    return null;
  }

  if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt")) {
    return "architecture-brief";
  }

  return null;
}

/** TB-2296: stricter than forecast filename heuristics — generic images and ZIPs are not analyzable classes. */
export function deriveQuickStartEvidencePresenceFromFileNames(
  fileNames: readonly string[],
): EvidencePresenceFlags {
  const classes = new Set<EvidenceGapClass>();

  for (const fileName of fileNames) {
    const implied = fileNameImpliesQuickStartClass(fileName);

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

export function hasQuickStartAnalyzableEvidenceClass(input: QuickStartAnalyzableEvidenceInput): boolean {
  if (input.limitedEvidenceAnalysisAcknowledged) {
    return (
      input.operatorBrief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS
      || input.evidenceFileNames.length > 0
    );
  }

  if (input.operatorBrief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS) {
    return true;
  }

  const presence = deriveQuickStartEvidencePresenceFromFileNames(input.evidenceFileNames);

  return (
    presence.hasArchitectureBrief
    || presence.hasCloudInventory
    || presence.hasInfrastructureAsCode
    || presence.hasArchitectureDiagram
    || presence.hasOperationalEvidence
  );
}

export function needsQuickStartLimitedEvidenceAcknowledgment(input: QuickStartAnalyzableEvidenceInput): boolean {
  if (input.limitedEvidenceAnalysisAcknowledged) {
    return false;
  }

  if (input.operatorBrief.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS) {
    return false;
  }

  if (input.evidenceFileNames.length === 0) {
    return false;
  }

  return !hasQuickStartAnalyzableEvidenceClass(input);
}

export function describeQuickStartAnalyzableEvidenceGap(input: QuickStartAnalyzableEvidenceInput): string | null {
  if (hasQuickStartAnalyzableEvidenceClass(input)) {
    return null;
  }

  if (input.evidenceFileNames.length > 0) {
    return "Attach analyzable architecture evidence (brief, diagram, IaC, inventory export, or operational notes), add at least 100 characters of architecture context, or confirm limited evidence before starting.";
  }

  return null;
}
