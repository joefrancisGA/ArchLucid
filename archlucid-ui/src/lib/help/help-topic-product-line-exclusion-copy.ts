import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type HelpTopicProductLineExclusionRedirect = {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
};

export type HelpTopicProductLineExclusionContent = {
  readonly title: string;
  readonly body: string;
  readonly redirects: readonly HelpTopicProductLineExclusionRedirect[];
};

/** ArchLucid-only help topics — SecureNow must not confirm existence via exclusion chrome. */
export const SECURENOW_SILENT_HELP_TOPIC_EXCLUSION_SLUGS = [
  "system-gravity",
  "inhabit-the-architecture",
  "sketch-a-change",
] as const;

const INSPECT_STORED_EVIDENCE_SECURENOW_EXCLUSION: HelpTopicProductLineExclusionContent = {
  title: "Architecture review help only",
  body:
    "The SecureNow (Security) product shell does not host Architecture review Evidence tabs. Inspect stored evidence applies to Architecture review workflows and in-app Architecture help routes only.",
  redirects: [
    {
      label: "Security evidence paths",
      href: "/help/security-evidence-paths",
      description: "SecureNow path inspect orientation for remediation factory evidence.",
    },
    {
      label: "Findings",
      href: "/help/findings",
      description: "Operational security findings queue and disposition help.",
    },
    {
      label: "Help home",
      href: "/help",
    },
  ],
};

const DEFAULT_SECURENOW_EXCLUSION: HelpTopicProductLineExclusionContent = {
  title: "Not available in this product shell",
  body: "This help topic applies to the ArchLucid Architecture product line and is hidden in SecureNow.",
  redirects: [
    {
      label: "Help home",
      href: "/help",
    },
  ],
};

export function resolveHelpTopicProductLineExclusionContent(
  slug: string,
  productLineId: ProductLineId,
): HelpTopicProductLineExclusionContent | null {
  if (productLineId !== "security") {
    return null;
  }

  if ((SECURENOW_SILENT_HELP_TOPIC_EXCLUSION_SLUGS as readonly string[]).includes(slug)) {
    return null;
  }

  if (slug === "inspect-stored-evidence") {
    return INSPECT_STORED_EVIDENCE_SECURENOW_EXCLUSION;
  }

  return DEFAULT_SECURENOW_EXCLUSION;
}
