import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { GOVERNANCE_POLICY_PACKS_PATH, governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";
import {
  isResponsibleAiPolicyPackId,
  resolvePolicyPackDetailKind,
} from "@/lib/policy/policy-pack-detail-resolver";
import { resolveSampleScenarioByPolicyPackId } from "@/lib/samples/registry";
import { CLAIMS_INTAKE_RULE_SET_VERSION } from "@/lib/samples/claims-intake/definition";
import { RESPONSIBLE_AI_POLICY_PACK_DEFAULT_VERSION } from "@/lib/responsible-ai-policy-pack-detail-content";
import { SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF } from "@/lib/showcase-static-demo";
import type { WizardFormValues } from "@/lib/wizard-schema";

/** Routes specialty template pack citations to a resolvable governance surface when one exists. */
export function resolveSpecialtyReviewPolicyPackHref(packId: string): string {
  const trimmed = packId.trim();
  const sampleScenario = resolveSampleScenarioByPolicyPackId(trimmed);

  if (sampleScenario !== null) {
    return sampleScenario.policyPackDetailHref;
  }

  const buyerHref = policyPackBuyerGovernanceDetailHref(trimmed);

  if (buyerHref !== null) {
    return buyerHref;
  }

  if (isResponsibleAiPolicyPackId(trimmed) || resolvePolicyPackDetailKind(trimmed, null) !== "unknown") {
    return governancePolicyPackDetailPath(trimmed);
  }

  return GOVERNANCE_POLICY_PACKS_PATH;
}

export const SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE = "Specialty review templates";

export const SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE =
  "Focused review guidance for SaaS, AI model controls, and healthcare claims scenarios.";

export const SPECIALTY_REVIEW_TEMPLATES_INTRO =
  "Each template prefills focused questions, evidence guidance, and policy-pack recommendations. You can change or remove template guidance before starting the review.";

export const SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE =
  "Specialty templates are optional. You can also start with the standard architecture review.";

export const SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL = "Use standard review";

export const SPECIALTY_REVIEW_TEMPLATES_INTEGRATIONS_NOTE =
  "External integrations are optional. You can complete a specialty review without connecting Jira, ServiceNow, Teams, Slack, or other systems.";

export const SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_TITLE = "Need help choosing?";

export const SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_BULLETS = [
  "Use the standard review for a broad architecture assessment.",
  "Use a specialty template when you need focused questions and policies.",
  "You can change templates before starting the review.",
] as const;

export type SpecialtyReviewCloudContext = WizardFormValues["cloudProvider"];

export const SPECIALTY_REVIEW_CLOUD_CONTEXT_OPTIONS: readonly {
  readonly id: SpecialtyReviewCloudContext;
  readonly label: string;
}[] = [
  { id: "None", label: "Cloud-neutral" },
  { id: "Azure", label: "Azure" },
  { id: "Aws", label: "AWS" },
  { id: "Gcp", label: "Google Cloud" },
] as const;

export const SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_LEGEND = "Cloud context for SaaS readiness";

export const SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_INTRO =
  "Optional — choose a hyperscaler when you want cloud-specific evidence guidance prefilled in review setup.";

export const SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_SELECTION_NOTE =
  "Applies when you continue to review setup with the SaaS readiness template selected.";

export const SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_SECTION_TITLE = "SaaS readiness review setup";

export const SPECIALTY_REVIEW_TEMPLATES_PREVIEW_DISCLAIMER =
  "Preview only — sample content does not start a review from this template.";

export const SPECIALTY_REVIEW_TEMPLATES_PREVIEW_CLOSE_LABEL = "Close preview";

export type SpecialtyReviewPolicyPackReference = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly version: string;
};

export type SpecialtyReviewTemplatePreview = {
  readonly exampleQuestions: readonly string[];
  readonly evidenceTypicallyRequested: readonly string[];
  readonly policyAreas: readonly SpecialtyReviewPolicyPackReference[];
  readonly likelyOutputs: readonly string[];
  readonly optionalIntegrations: readonly string[];
};

export type SpecialtyReviewTemplateId = "saas-readiness" | "ai-governance" | "healthcare-claims";

export type SpecialtyReviewTemplateDefinition = {
  readonly id: SpecialtyReviewTemplateId;
  /** Review intake `?template=` value — must exist in `REVIEW_INTAKE_EXAMPLE_TEMPLATES`. */
  readonly intakeTemplateId: string;
  readonly title: string;
  readonly purpose: string;
  readonly bestFor: string;
  readonly focusAreas: readonly string[];
  readonly expectedOutput: string;
  readonly supportsCloudContext: boolean;
  readonly sampleReviewHref: string;
  readonly policyPacks: readonly SpecialtyReviewPolicyPackReference[];
  readonly lastReviewedUtc: string;
  readonly preview: SpecialtyReviewTemplatePreview;
};

export const SPECIALTY_REVIEW_TEMPLATES: readonly SpecialtyReviewTemplateDefinition[] = [
  {
    id: "saas-readiness",
    intakeTemplateId: "saas-readiness",
    title: "SaaS readiness",
    purpose: "Evaluate whether a SaaS architecture is ready for secure, reliable enterprise use.",
    bestFor: "Platform and security teams preparing a multi-tenant SaaS workload for enterprise adoption.",
    focusAreas: [
      "identity and access",
      "tenant isolation",
      "resilience",
      "data protection",
      "operational readiness",
    ],
    expectedOutput: "An evidence-backed SaaS readiness review with prioritized findings and recommendations.",
    supportsCloudContext: true,
    sampleReviewHref: "/architecture/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf",
    policyPacks: [
      {
        id: "saas-security-controls",
        label: "SaaS Security Controls",
        href: resolveSpecialtyReviewPolicyPackHref("saas-security-controls"),
        version: "2.1.0",
      },
      {
        id: "soc2-architecture-themes",
        label: "SOC 2 Type II (Architecture Themes)",
        href: resolveSpecialtyReviewPolicyPackHref("soc2-architecture-themes"),
        version: "1.2.0",
      },
    ],
    lastReviewedUtc: "2026-04-15T00:00:00.000Z",
    preview: {
      exampleQuestions: [
        "How is tenant isolation enforced across data stores and application tiers?",
        "What identity and access controls protect administrative and customer-facing APIs?",
        "How do you detect, respond to, and recover from production incidents?",
      ],
      evidenceTypicallyRequested: [
        "Architecture diagrams and service boundaries",
        "Identity and access configuration summaries",
        "Cloud inventory or infrastructure exports when available",
        "Operational runbooks and monitoring coverage",
      ],
      policyAreas: [
        {
          id: "saas-security-controls",
          label: "SaaS Security Controls",
          href: resolveSpecialtyReviewPolicyPackHref("saas-security-controls"),
          version: "2.1.0",
        },
        {
          id: "soc2-architecture-themes",
          label: "SOC 2 Type II (Architecture Themes)",
          href: resolveSpecialtyReviewPolicyPackHref("soc2-architecture-themes"),
          version: "1.2.0",
        },
      ],
      likelyOutputs: [
        "Prioritized findings with evidence references",
        "Policy-backed recommendations for enterprise readiness",
        "Review suitable for stakeholder review",
      ],
      optionalIntegrations: [
        "Cloud evidence imports (Azure, AWS, or Google Cloud)",
        "Jira, ServiceNow, Teams, or Slack for workflow handoff",
      ],
    },
  },
  {
    id: "ai-governance",
    intakeTemplateId: "ai-governance",
    title: "AI policy",
    purpose: "Evaluate an AI solution against responsible-AI, risk, evidence, and policy expectations.",
    bestFor: "Risk, compliance, and architecture leaders reviewing ML or generative-AI workloads.",
    focusAreas: [
      "model and data risk",
      "transparency",
      "human oversight",
      "privacy",
      "monitoring",
      "export readiness",
    ],
    expectedOutput: "An AI policy review with evidence-backed findings and approval.",
    supportsCloudContext: false,
    sampleReviewHref: "/architecture/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b",
    policyPacks: [
      {
        id: "responsible-ai",
        label: "Responsible AI",
        href: resolveSpecialtyReviewPolicyPackHref("1"),
        version: RESPONSIBLE_AI_POLICY_PACK_DEFAULT_VERSION,
      },
    ],
    lastReviewedUtc: "2026-05-01T00:00:00.000Z",
    preview: {
      exampleQuestions: [
        "What data sources feed model training and inference, and how is sensitive data handled?",
        "Where is human review required before high-impact automated decisions?",
        "How are model changes, prompts, and tool access controlled and audited?",
      ],
      evidenceTypicallyRequested: [
        "Model and data-flow diagrams",
        "Responsible-AI policy assignments",
        "Logging, monitoring, and escalation procedures",
        "Synthetic or redacted sample outputs for evaluation",
      ],
      policyAreas: [
        {
          id: "responsible-ai",
          label: "Responsible AI",
          href: resolveSpecialtyReviewPolicyPackHref("1"),
          version: RESPONSIBLE_AI_POLICY_PACK_DEFAULT_VERSION,
        },
      ],
      likelyOutputs: [
        "Policy findings tied to evidence",
        "Disposition on oversight and monitoring gaps",
        "Exportable review summary for stakeholders",
      ],
      optionalIntegrations: [
        "Cloud evidence imports when models run on a hyperscaler",
        "Jira, ServiceNow, Teams, or Slack for escalation routing",
      ],
    },
  },
  {
    id: "healthcare-claims",
    intakeTemplateId: "claims-intake-modernization",
    title: "Healthcare claims",
    purpose:
      "Evaluate a healthcare claims architecture for privacy, minimum-necessary use, security, and auditability.",
    bestFor: "Healthcare platform teams modernizing claims intake, validation, or adjudication flows.",
    focusAreas: [
      "PHI handling",
      "minimum-necessary access",
      "data lineage",
      "retention",
      "audit controls",
      "regulatory evidence",
    ],
    expectedOutput: "A policy-backed healthcare claims review with findings, evidence, and an audit-ready record.",
    supportsCloudContext: false,
    sampleReviewHref: "/architecture/reviews/claims-intake-modernization",
    policyPacks: [
      {
        id: "demo-healthcare-claims-pack",
        label: "Healthcare Claims Policy Pack",
        href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
        version: CLAIMS_INTAKE_RULE_SET_VERSION,
      },
    ],
    lastReviewedUtc: "2026-03-20T00:00:00.000Z",
    preview: {
      exampleQuestions: [
        "Where does protected health information enter, transform, and leave the claims pipeline?",
        "How is minimum-necessary access enforced for operators and integrations?",
        "What audit trail exists for configuration and data-access changes?",
      ],
      evidenceTypicallyRequested: [
        "Claims intake and validation flow diagrams",
        "Healthcare policy pack assignments",
        "Access-control and retention design notes",
        "Synthetic demo scenarios when live PHI is unavailable",
      ],
      policyAreas: [
        {
          id: "demo-healthcare-claims-pack",
          label: "Healthcare Claims Policy Pack",
          href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
          version: CLAIMS_INTAKE_RULE_SET_VERSION,
        },
      ],
      likelyOutputs: [
        "Findings with policy and evidence references",
        "Approval checks before finalize when enabled",
        "Audit-ready review record",
      ],
      optionalIntegrations: [
        "Evidence uploads and architecture briefs",
        "Jira, ServiceNow, Teams, or Slack for remediation tracking",
      ],
    },
  },
] as const;

export const SPECIALTY_REVIEW_TEMPLATES_RELATED_LINKS = [
  { label: "First review guide", href: "/architecture/first-review-guide" },
  { label: "Standard review", href: "/architecture/reviews/new" },
  { label: "Pattern library", href: "/insights/patterns" },
  { label: "Policy packs", href: "/governance/policy-packs" },
  { label: "Help choosing a template", href: "#need-help-choosing" },
] as const;

export const SPECIALTY_REVIEW_TEMPLATES_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "specialty-template-catalog", title: "Available templates" },
  { level: 2, id: "specialty-template-comparison", title: "Compare templates" },
  { level: 2, id: "integrations-optional", title: "Integrations" },
  { level: 2, id: "need-help-choosing", title: "Need help choosing?" },
];

const REVIEW_INTAKE_CLOUD_QUERY_KEY = "cloud";

const CLOUD_QUERY_TO_WIZARD: Readonly<Record<string, SpecialtyReviewCloudContext>> = {
  none: "None",
  azure: "Azure",
  aws: "Aws",
  gcp: "Gcp",
};

export function resolveSpecialtyReviewCloudFromSearchParam(
  raw: string | null | undefined,
): SpecialtyReviewCloudContext | null {
  const normalized = raw?.trim().toLowerCase() ?? "";

  if (normalized.length === 0) {
    return null;
  }

  return CLOUD_QUERY_TO_WIZARD[normalized] ?? null;
}

export function specialtyReviewCloudQueryValue(cloud: SpecialtyReviewCloudContext): string {
  switch (cloud) {
    case "None":
      return "none";
    case "Azure":
      return "azure";
    case "Aws":
      return "aws";
    case "Gcp":
      return "gcp";
    default: {
      const exhaustive: never = cloud;

      return exhaustive;
    }
  }
}

export function buildSpecialtyReviewUseTemplateHref(input: {
  readonly intakeTemplateId: string;
  readonly cloudContext?: SpecialtyReviewCloudContext;
}): string {
  const params = new URLSearchParams();
  const cloud = input.cloudContext ?? "None";

  if (cloud !== "None") {
    params.set("path", "detailed");
    params.set(REVIEW_INTAKE_CLOUD_QUERY_KEY, specialtyReviewCloudQueryValue(cloud));
  } else {
    params.set("path", "guided-intake");
  }

  params.set("template", input.intakeTemplateId);

  return `/architecture/reviews/new?${params.toString()}`;
}

export function findSpecialtyReviewTemplate(
  templateId: SpecialtyReviewTemplateId,
): SpecialtyReviewTemplateDefinition | undefined {
  return SPECIALTY_REVIEW_TEMPLATES.find((row) => row.id === templateId);
}

export function specialtyReviewTemplatesCompareHref(): string {
  return `${inAppHelpHref("specialty-walkthroughs")}#specialty-template-comparison`;
}

export const SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT =
  "Your role can preview and compare templates and open sample reviews. Ask a workspace administrator for review creation permission to start a review from a template.";

export const SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_STATUS_LABEL = "Preview only";

export const SPECIALTY_REVIEW_TEMPLATES_AUTHORITY_LOADING_LABEL = "Checking review creation permission…";

export const SPECIALTY_REVIEW_TEMPLATES_POLICY_PACK_LOADING_LABEL = "Loading policy pack guidance…";

export const SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL = "Open sample review";

export const SPECIALTY_REVIEW_TEMPLATES_BUYER_DEMO_USE_HINT =
  "Templates are optional. Use Start review for a standard intake, or pick a template below to prefill focused questions.";

/** Buyer-safe catalog provenance — latest template review stamp, no registry taxonomy tokens. */
export function specialtyReviewTemplatesBuyerProvenanceLine(): string {
  const latestReviewedUtc = SPECIALTY_REVIEW_TEMPLATES.reduce((latest, template) => {
    return template.lastReviewedUtc > latest ? template.lastReviewedUtc : latest;
  }, SPECIALTY_REVIEW_TEMPLATES[0]?.lastReviewedUtc ?? "");

  const reviewedOn = latestReviewedUtc.slice(0, 10);

  return reviewedOn.length > 0
    ? `Template catalog last reviewed ${reviewedOn}`
    : "Template catalog for focused review scenarios";
}
