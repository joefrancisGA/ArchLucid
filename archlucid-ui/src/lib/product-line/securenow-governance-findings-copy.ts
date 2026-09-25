import { SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE } from "@/lib/findings/findings-help-guide-content";
import type { LayerGuidanceBlock } from "@/lib/layer-guidance";
import type { PageCapabilityBoundary } from "@/lib/page-capability-boundary";
import { PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY } from "@/lib/page-capability-boundary";
import { SECURENOW_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE } from "@/lib/product-line/securenow-governance-assigned-to-me-copy";

export const SECURENOW_GOVERNANCE_FINDINGS_PAGE_TITLE = "Findings" as const;

export const SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE: LayerGuidanceBlock = {
  layerBadge: "Findings",
  headline:
    "Track cloud security findings from ARC-AMPE policy evaluation and connected inventory.",
  useWhen:
    "Assign owners, triage severity, and trace findings back to inventory evidence and policy rules.",
  firstPilotNote:
    "After cloud inventory is connected, use this queue for workspace-wide finding triage and remediation ownership.",
  enterpriseFootnote:
    "Each finding should remain traceable to policy pack evaluation, inventory evidence, and audit lineage.",
  omitReviewPackageScopeHelp: true,
};

export const PAGE_CAPABILITY_BOUNDARY_SECURENOW_GOVERNANCE_FINDINGS: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Automatically remediate cloud configuration.",
    "Author or change policy packs and policy rules.",
    "Invent findings that are not traceable to policy evaluation, inventory evidence, or assigned dispositions.",
    "Replace the Decision register or audit evidence lineage as the authority of record.",
  ],
};

export const SECURENOW_GOVERNANCE_FINDINGS_EMPTY_TITLE =
  "No cloud security findings in this workspace yet" as const;

export const SECURENOW_GOVERNANCE_FINDINGS_EMPTY_BODY =
  "Findings appear when assigned policy packs evaluate connected cloud inventory. Assign packs from Policy packs to start evaluation." as const;

export const SECURENOW_GOVERNANCE_FINDINGS_EMPTY_POLICY_PACKS_HREF = SECURENOW_POLICY_PACKS_PATH;

export type SecureNowGovernanceFindingsEmptyStateCopy = {
  readonly title: string;
  readonly description: string;
  readonly policyPacksHref: string;
};

export function resolveSecureNowGovernanceFindingsPageTitle(): string {
  return SECURENOW_GOVERNANCE_FINDINGS_PAGE_TITLE;
}

export function resolveSecureNowGovernanceFindingsPageSubtitle(): string {
  return SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE;
}

export function resolveSecureNowGovernanceFindingsClaimDiscipline(): string {
  return SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE;
}

export function resolveSecureNowGovernanceFindingsEmptyStateCopy(): SecureNowGovernanceFindingsEmptyStateCopy {
  return {
    title: SECURENOW_GOVERNANCE_FINDINGS_EMPTY_TITLE,
    description: SECURENOW_GOVERNANCE_FINDINGS_EMPTY_BODY,
    policyPacksHref: SECURENOW_GOVERNANCE_FINDINGS_EMPTY_POLICY_PACKS_HREF,
  };
}
