import type { ArchitectureStructuredParseResult, ArchitectureStructuredSectionKey } from "@/lib/architecture/architecture-structured-content-types";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";

export type SponsorReadinessStatus = "ready" | "needs-attention" | "preliminary-only";

export type SponsorReadinessIssueId =
  | "missing-business-owner"
  | "unconfirmed-business-outcome"
  | "incomplete-system-interactions"
  | "missing-trust-boundaries"
  | "unresolved-high-severity-risks"
  | "missing-operational-assumptions";

export type SponsorReadinessIssueSeverity = "advisory" | "blocking";

export type SponsorReadinessIssue = {
  readonly id: SponsorReadinessIssueId;
  readonly label: string;
  readonly resolveHref: string;
  readonly severity: SponsorReadinessIssueSeverity;
};

export type SponsorSharingBlockReason =
  | "policy"
  | "permission"
  | "restricted-information"
  | null;

export type ArchitectureSponsorReadinessAssessment = {
  readonly status: SponsorReadinessStatus;
  readonly issues: readonly SponsorReadinessIssue[];
  readonly architectureCompletenessLabel: string;
  readonly governanceApprovalLabel: string;
  readonly assessmentCompletionLabel: string;
  readonly sharingBlocked: boolean;
  readonly sharingBlockReason: SponsorSharingBlockReason;
  readonly sharingBlockMessage: string | null;
  readonly confidentialityLabel: string | null;
  readonly restrictedInformationDetected: boolean;
};

export type AssessArchitectureSponsorReadinessInput = {
  readonly architecture: BuildArchitectureCreatedHomeModelInput;
  readonly architectureSourceText: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly canShare: boolean;
  readonly policyProhibitsExternalSharing?: boolean;
};

const MIN_OUTCOME_CHARS = 10;
const MIN_OVERVIEW_CHARS = 40;
const HIGH_SEVERITY_THRESHOLD = 3;
const POLICY_PROHIBITION_MARKER = "[SPONSOR-SHARING-PROHIBITED]";
const RESTRICTED_INFORMATION_MARKERS = [
  "[RESTRICTED]",
  "[NO-EXTERNAL-SHARE]",
  "CUI//",
  "TOP SECRET",
] as const;

const OPERATIONAL_ASSUMPTION_PATTERN =
  /availability|uptime|sla|compliance|hipaa|pci|cost|operational|residency|retention|dr\b|disaster recovery/i;

function sectionHasContent(
  sections: ArchitectureStructuredParseResult["sections"],
  key: ArchitectureStructuredSectionKey,
): boolean {
  const section = sections.find((entry) => entry.key === key);

  if (section === undefined) {
    return false;
  }

  const narrative = section.narrativeMarkdown?.trim() ?? "";

  return narrative.length > 0 || section.entities.length > 0;
}

function issue(
  id: SponsorReadinessIssueId,
  label: string,
  resolveHref: string,
  severity: SponsorReadinessIssueSeverity,
): SponsorReadinessIssue {
  return { id, label, resolveHref, severity };
}

export function detectRestrictedArchitectureInformation(sourceText: string): boolean {
  const normalized = sourceText.toUpperCase();

  return RESTRICTED_INFORMATION_MARKERS.some((marker) => normalized.includes(marker.toUpperCase()));
}

export function detectPolicyProhibitedSponsorSharing(sourceText: string): boolean {
  return sourceText.includes(POLICY_PROHIBITION_MARKER);
}

export function resolveArchitectureConfidentialityLabel(sourceText: string): string | null {
  const match = /confidentiality\s*:\s*([^\n]+)/i.exec(sourceText);

  if (match?.[1] !== undefined && match[1].trim().length > 0) {
    return match[1].trim();
  }

  if (/hipaa|phi\b/i.test(sourceText)) {
    return "HIPAA-sensitive — internal review only";
  }

  if (/pci\b/i.test(sourceText)) {
    return "PCI-sensitive — internal review only";
  }

  return "Internal — preliminary architecture draft";
}

function countHighSeverityFindings(findings: readonly QuickDecisionFinding[]): number {
  return findings.filter((finding) => finding.severityValue >= HIGH_SEVERITY_THRESHOLD).length;
}

function deriveReadinessStatus(issues: readonly SponsorReadinessIssue[]): SponsorReadinessStatus {
  if (issues.some((entry) => entry.severity === "blocking")) {
    return "preliminary-only";
  }

  if (issues.length >= 3) {
    return "preliminary-only";
  }

  if (issues.length > 0) {
    return "needs-attention";
  }

  return "ready";
}

/** Evidence-based sponsor-readiness assessment for architecture-creation review detail. */
export function assessArchitectureSponsorReadiness(
  input: AssessArchitectureSponsorReadinessInput,
): ArchitectureSponsorReadinessAssessment {
  const clarifyHref = REVIEWS_NEW_CREATE_ARCHITECTURE_HREF;
  const parsed = parseArchitectureGeneratedContent(input.architectureSourceText, {
    architectureName: input.architecture.architectureName,
    architectureOverview: input.architecture.architectureOverview,
    businessOutcome: input.architecture.businessOutcome,
    peopleAndSystems: input.architecture.peopleAndSystems,
  });

  const issues: SponsorReadinessIssue[] = [];

  if ((input.architecture.ownerLabel ?? "").trim().length === 0) {
    issues.push(
      issue("missing-business-owner", "Missing business owner", clarifyHref, "advisory"),
    );
  }

  if (input.architecture.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    issues.push(
      issue(
        "unconfirmed-business-outcome",
        "Business outcome is unconfirmed or still brief",
        clarifyHref,
        "advisory",
      ),
    );
  }

  const operationalText = `${input.architecture.architectureOverview}\n${input.architecture.businessOutcome}`;
  const hasOperationalSignals =
    OPERATIONAL_ASSUMPTION_PATTERN.test(operationalText)
    || sectionHasContent(parsed.sections, "assumptions")
    || sectionHasContent(parsed.sections, "constraints");

  if (!hasOperationalSignals) {
    issues.push(
      issue(
        "missing-operational-assumptions",
        "Missing cost, availability, compliance, or operational assumptions",
        clarifyHref,
        "advisory",
      ),
    );
  }

  const hasTrustBoundaries =
    sectionHasContent(parsed.sections, "trust-boundaries")
    || /trust boundary|security boundary|network segmentation|private networking|perimeter/i.test(operationalText);

  if (!hasTrustBoundaries) {
    issues.push(
      issue("missing-trust-boundaries", "Trust boundaries are not documented", clarifyHref, "blocking"),
    );
  }

  const hasSystemInteractions =
    input.architecture.peopleAndSystems.some(
      (entry) => entry.kind === "Machine" || entry.kind === "Both",
    )
    || sectionHasContent(parsed.sections, "external-integrations")
    || sectionHasContent(parsed.sections, "systems-and-services");

  if (!hasSystemInteractions) {
    issues.push(
      issue(
        "incomplete-system-interactions",
        "System interactions or integrations are incomplete",
        clarifyHref,
        "advisory",
      ),
    );
  }

  const highSeverityCount = countHighSeverityFindings(input.findings);

  if (highSeverityCount > 0) {
    issues.push(
      issue(
        "unresolved-high-severity-risks",
        `${highSeverityCount} unresolved high-severity risk${highSeverityCount === 1 ? "" : "s"}`,
        "#run-explanation",
        "blocking",
      ),
    );
  }

  const policyProhibited =
    input.policyProhibitsExternalSharing === true
    || detectPolicyProhibitedSponsorSharing(input.architectureSourceText);
  const restrictedInformationDetected = detectRestrictedArchitectureInformation(input.architectureSourceText);

  let sharingBlockReason: SponsorSharingBlockReason = null;
  let sharingBlockMessage: string | null = null;

  if (!input.canShare) {
    sharingBlockReason = "permission";
    sharingBlockMessage = "Operator permission required";
  } else if (policyProhibited) {
    sharingBlockReason = "policy";
    sharingBlockMessage = "Organizational policy prohibits external sponsor sharing";
  } else if (restrictedInformationDetected) {
    sharingBlockReason = "restricted-information";
    sharingBlockMessage = "Restricted information must be redacted before sharing";
  }

  const status = deriveReadinessStatus(issues);
  const overviewLength = input.architecture.architectureOverview.trim().length;

  return {
    status,
    issues,
    architectureCompletenessLabel:
      overviewLength >= 100
        ? "Strong architecture context captured"
        : overviewLength >= MIN_OVERVIEW_CHARS
          ? "Partial architecture context captured"
          : "Architecture context is still thin",
    governanceApprovalLabel: "Not requested — preliminary architecture draft",
    assessmentCompletionLabel: input.architecture.assessmentInProgress
      ? "Assessment in progress"
      : input.findings.length > 0
        ? "Initial assessment findings available"
        : "Assessment not started or still populating",
    sharingBlocked: sharingBlockReason !== null,
    sharingBlockReason,
    sharingBlockMessage,
    confidentialityLabel: resolveArchitectureConfidentialityLabel(input.architectureSourceText),
    restrictedInformationDetected,
  };
}
