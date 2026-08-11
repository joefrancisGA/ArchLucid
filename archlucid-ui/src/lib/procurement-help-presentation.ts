import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF,
  PROCUREMENT_HELP_NDA_REQUEST_HREF,
  PROCUREMENT_HELP_SALES_CONTACT_HREF,
} from "@/lib/procurement-help-evidence-copy";

export const PROCUREMENT_HELP_TOPIC_SLUG = "procurement" as const;

export type ProcurementFaqPostureKey = "soc2" | "penetration-test";

export type ProcurementFaqPosture = {
  readonly key: ProcurementFaqPostureKey;
  readonly questionNumber: number;
  readonly label: string;
  readonly kind: EnterpriseStatusKind;
  readonly summary: string;
};

export const PROCUREMENT_FAQ_POSTURES: readonly ProcurementFaqPosture[] = [
  {
    key: "soc2",
    questionNumber: 1,
    label: "Self-assessment",
    kind: "needs-attention",
    summary: "SOC 2 Type II CPA attestation is not currently issued.",
  },
  {
    key: "penetration-test",
    questionNumber: 2,
    label: "Owner-conducted",
    kind: "in-progress",
    summary: "Third-party vendor engagement is planned, not yet scheduled.",
  },
] as const;

export function isProcurementHelpTopic(helpTopicSlug: string | undefined): boolean {
  return helpTopicSlug === PROCUREMENT_HELP_TOPIC_SLUG;
}

export function resolveProcurementFaqPostureForQuestion(questionNumber: number): ProcurementFaqPosture | null {
  return PROCUREMENT_FAQ_POSTURES.find((posture) => posture.questionNumber === questionNumber) ?? null;
}

export function parseProcurementFaqQuestionNumber(headingTitle: string): number | null {
  const match = headingTitle.match(/^(\d+)\./);

  if (match?.[1] === undefined) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Buyer-safe rewrites for `/help/procurement` FAQ answers — artifact links, posture copy, and template voice.
 */
export function rewriteProcurementFaqBuyerPresentation(markdown: string): string {
  return markdown
    .replace(
      /\*\*Answer:\*\* Today we publish a \*\*SOC 2 self-assessment\*\* and control mapping—SOC 2 \*\*Type II\*\* CPA attestation is \*\*not currently issued\*\* \(\[SOC 2 self-assessment\]\(\/help\/soc2-self-assessment\)\)\. Type \*\*I\*\* followed by Type \*\*II\*\* is the typical SaaS roadmap once operating evidence exists alongside budget\./gi,
      "**Answer:** Today we publish a [SOC 2 self-assessment](/help/soc2-self-assessment) and control mapping. SOC 2 Type II CPA attestation is not currently issued. Type I followed by Type II is the typical SaaS roadmap once operating evidence exists alongside budget.",
    )
    .replace(
      /\*\*Answer:\*\* \*\*V1\*\* uses \*\*owner-conducted\*\* penetration-style testing and internal assessments\. A \*\*third-party\*\* vendor engagement is \*\*planned, not yet scheduled\*\*; there is \*\*no\*\* awarded external vendor today\. Redacted assessor summaries, when they exist, are distributed \*\*under NDA\*\* through security \/ sales diligence\. Lack of a published third-party pen-test report is an honesty boundary, not a hidden control claim\./gi,
      `**Answer:** ArchLucid uses owner-conducted penetration-style testing and internal assessments. A third-party vendor engagement is planned, not yet scheduled; there is no awarded external vendor today. Redacted assessor summaries, when they exist, are distributed under NDA through [Security & trust](/administration/security-trust). Lack of a published third-party pen-test report is an honesty boundary, not a hidden control claim.`,
    )
    .replace(
      /\*\*Answer:\*\* \*\*Vendor-hosted\*\* Azure workloads\./gi,
      "**Answer:** ArchLucid-hosted Azure workloads.",
    )
    .replace(
      /Request current SLA summary language through security \/ sales\./gi,
      `Request current SLA summary language through [Security & trust](${PROCUREMENT_HELP_NDA_REQUEST_HREF}).`,
    )
    .replace(
      /Request MSA \/ Order Form language through legal \/ sales diligence\./gi,
      `Request MSA / Order Form language through [sales contact](${PROCUREMENT_HELP_SALES_CONTACT_HREF}).`,
    )
    .replace(
      /directly from Vendor during diligence/gi,
      `directly from ArchLucid during diligence — [request coverage details](${PROCUREMENT_HELP_NDA_REQUEST_HREF})`,
    )
    .replace(
      /coordinated via sales/gi,
      `coordinated via [sales contact](${PROCUREMENT_HELP_SALES_CONTACT_HREF})`,
    )
    .replace(
      /ask sales for the current reference posture/gi,
      `[request references](${PROCUREMENT_HELP_SALES_CONTACT_HREF}) for the current reference posture`,
    )
    .replace(
      /request Enterprise terms through sales/gi,
      `request [Enterprise terms](${PROCUREMENT_HELP_SALES_CONTACT_HREF})`,
    )
    .replace(
      /distributed \*\*under NDA\*\* through security \/ sales diligence/gi,
      `distributed under NDA through [Security & trust](${PROCUREMENT_HELP_NDA_REQUEST_HREF})`,
    )
    .replace(
      /distributed under NDA through security \/ sales diligence/gi,
      `distributed under NDA through [Security & trust](${PROCUREMENT_HELP_NDA_REQUEST_HREF})`,
    )
    .replace(
      / or use \*\*[`']\/pricing\?[^*]+[`']\*\*/gi,
      "",
    )
    .replace(
      /or use [`']\/pricing\?[^`']+[`']/gi,
      `[Request a custom policy pack quote](${PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF})`,
    )
    .replace(
      /directly from ArchLucid during diligence — \[request coverage details\]\([^)]+\)—figures/gi,
      `directly from ArchLucid during diligence — [request coverage details](${PROCUREMENT_HELP_NDA_REQUEST_HREF}) — figures`,
    )
    .replace(
      /submit a quote with tier interest \*\*Custom policy pack \(professional services\)\*\*/gi,
      `[Request a custom policy pack quote](${PROCUREMENT_HELP_CUSTOM_POLICY_PACK_QUOTE_HREF})`,
    )
    .replace(/\bVendor-hosted\b/gi, "ArchLucid-hosted")
    .replace(/\bfrom Vendor\b/gi, "from ArchLucid");
}
