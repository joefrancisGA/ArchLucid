import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { WizardFormValues } from "@/lib/wizard-schema";

export const SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE = "Specialty review templates";

export const SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE =
  "Start with focused guidance for a specific architecture, governance, or industry scenario.";

export const SPECIALTY_REVIEW_TEMPLATES_INTRO =
  "Specialty templates adapt the standard ArchLucid review workflow to a particular technology or governance scenario. Each template provides focused questions, relevant evidence guidance, policy recommendations, and an expected review outcome. You can change or remove the template guidance as your review evolves.";

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

export type SpecialtyReviewTemplatePreview = {
  readonly exampleQuestions: readonly string[];
  readonly evidenceTypicallyRequested: readonly string[];
  readonly policyAreas: readonly string[];
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
    sampleReviewHref: "/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf",
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
        "SaaS security baseline",
        "Reliability and resilience themes",
        "Data protection and encryption",
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
    title: "AI governance",
    purpose: "Evaluate an AI solution against responsible-AI, risk, evidence, and governance expectations.",
    bestFor: "Risk, compliance, and architecture leaders reviewing ML or generative-AI workloads.",
    focusAreas: [
      "model and data risk",
      "transparency",
      "human oversight",
      "privacy",
      "monitoring",
      "approval readiness",
    ],
    expectedOutput: "An AI governance review with evidence-backed findings and governance decisions.",
    supportsCloudContext: false,
    sampleReviewHref: "/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b",
    preview: {
      exampleQuestions: [
        "What data sources feed model training and inference, and how is sensitive data handled?",
        "Where is human review required before high-impact automated decisions?",
        "How are model changes, prompts, and tool access governed and audited?",
      ],
      evidenceTypicallyRequested: [
        "Model and data-flow diagrams",
        "Responsible-AI policy assignments",
        "Logging, monitoring, and escalation procedures",
        "Synthetic or redacted sample outputs for evaluation",
      ],
      policyAreas: [
        "Responsible AI and model risk",
        "Privacy and data minimization",
        "Human oversight and approval gates",
      ],
      likelyOutputs: [
        "Governance findings tied to evidence",
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
    sampleReviewHref: "/reviews/claims-intake-modernization",
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
        "PHI minimization and boundary controls",
        "Healthcare compliance themes",
        "Auditability and evidence lineage",
      ],
      likelyOutputs: [
        "Findings with policy and evidence references",
        "Pre-finalization governance checks when enabled",
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
  { label: "Pattern library", href: "/patterns" },
  { label: "Policy packs", href: "/governance/policy-packs" },
  { label: "Help choosing a template", href: "#need-help-choosing" },
] as const;

export const SPECIALTY_REVIEW_TEMPLATES_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "specialty-template-catalog", title: "Available templates" },
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
  return `${inAppHelpHref("specialty-walkthroughs")}#specialty-template-catalog`;
}

export const SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT =
  "Your role can preview and compare templates and open sample reviews. Ask a workspace administrator for review creation permission to start a review from a template.";
