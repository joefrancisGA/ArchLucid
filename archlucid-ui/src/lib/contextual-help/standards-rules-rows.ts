/** Standards & rules resolution hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { STANDARDS_RULES_HELP_CANONICAL_PATH } from "@/lib/standards-rules-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

const STANDARDS_RULES_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Inspect standards and policy rules applied to a review, including enforcement mode, source pack, and linked evidence.",
  whatToDoNext:
    "Open linked findings or the evidence trail for a rule, then export a resolution snapshot when you need a citeable record.",
  whyEmpty: "Rules appear after a policy pack or governance configuration applies checks to a review.",
  whereToConfigurePrerequisite: "Assign and order policy packs for the current workspace and project scope.",
  whatToDoNextAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  whereToConfigureAction: {
    label: "Open findings",
    href: GOVERNANCE_FINDINGS_PATH,
  },
} as const;

export const STANDARDS_RULES_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/governance/standards-and-rules",
    entry: STANDARDS_RULES_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: STANDARDS_RULES_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Standards & rules — how effective policy resolution rows are read, when to export snapshots, and how this differs from the policy packs library.",
      whatToDoNext: "Open standards & rules for the review in scope, then follow policy packs or findings when maintenance is required.",
      whyEmpty: "This guide is always available; rule rows appear when packs apply checks to a review.",
      whereToConfigurePrerequisite:
        "Policy packs help explains how packs are authored, versioned, and applied across reviews.",
      whatToDoNextAction: {
        label: "Open standards & rules",
        href: "/governance/standards-and-rules",
      },
      whereToConfigureAction: {
        label: "Read policy packs help",
        href: inAppHelpHref("policy-packs"),
      },
    },
  },
];
