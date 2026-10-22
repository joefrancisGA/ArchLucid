import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL,
  GOVERNANCE_APPROVAL_LABEL,
  GOVERNANCE_APPROVAL_SUBMIT_LABEL,
} from "@/lib/vocabulary/governance-approval-vocabulary";
import { OPERATOR_ATTENTION_KIND_DESTINATIONS } from "@/lib/operator/operator-attention-kind-destinations";
import { GETTING_STARTED_HELP_SUBTITLE } from "@/lib/getting-started-help-guide-content";
import { DOMAIN_TERMS } from "@/lib/i18n";

const REPO_ROOT = join(process.cwd(), "..");

/** Canonical surfaces that must not show the word "governance" to buyers. */
const CANONICAL_USER_FACING_COPY_MODULES = [
  "archlucid-ui/src/lib/vocabulary/governance-approval-vocabulary.ts",
  "archlucid-ui/src/lib/operator/operator-attention-kind-destinations.ts",
  "archlucid-ui/src/components/operator-home/OperatorHomePrimaryAttentionLead.tsx",
  "archlucid-ui/src/lib/getting-started-help-guide-content.ts",
  "archlucid-ui/src/lib/glossary-definitions.ts",
  "archlucid-ui/public/doc-index.json",
  "archlucid-ui/public/pricing.json",
] as const;

const ALLOWED_GOVERNANCE_MARKERS = [
  "/governance/",
  "governance-approval",
  "model-governance",
  "package-governance",
  "ai-governance",
  "effective-governance",
  "governance-workflow",
  "governance_gate",
  "operate-governance",
] as const;

function stripAllowedGovernanceMarkers(source: string): string {
  let next = source;

  for (const marker of ALLOWED_GOVERNANCE_MARKERS) {
    next = next.split(marker).join("");
  }

  return next;
}

function extractQuotedStrings(source: string): string {
  const matches = source.match(/"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'/g);

  return matches?.join(" ") ?? "";
}

describe("user-facing governance vocabulary", () => {
  it("keeps canonical approval labels free of the word governance", () => {
    const corpus = [
      GOVERNANCE_APPROVAL_LABEL,
      GOVERNANCE_APPROVAL_SUBMIT_LABEL,
      GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL,
      OPERATOR_ATTENTION_KIND_DESTINATIONS["awaiting-approval"].description,
      GETTING_STARTED_HELP_SUBTITLE,
      DOMAIN_TERMS.governanceApproval,
    ]
      .join(" ")
      .toLowerCase();

    expect(corpus).not.toMatch(/\bgovernance\b/);
  });

  it("keeps canonical copy modules free of the word governance", () => {
    for (const relativePath of CANONICAL_USER_FACING_COPY_MODULES) {
      const source = extractQuotedStrings(readFileSync(join(REPO_ROOT, relativePath), "utf8"));
      const scrubbed = stripAllowedGovernanceMarkers(source).toLowerCase();

      expect(scrubbed, relativePath).not.toMatch(/\bgovernance\b/);
    }
  });
});
