import { describe, expect, it } from "vitest";

import { HELP_MARKDOWN_TOPIC_RULE_STAGES } from "@/lib/help-markdown-presentation";
import { findHelpMarkdownTopicRuleSet } from "@/lib/help-markdown-presentation-pipeline";

/**
 * Stage rule sets resolve first-match-wins, so both the stage a topic lives in and its position
 * within that stage change rendered help copy. These expectations pin both.
 */
const EXPECTED_SOURCE_PRESTAGE_IDS: readonly string[] = ["evaluator-workbook"];

const EXPECTED_CONTRIBUTOR_SECTION_IDS: readonly string[] = [
  "configuration-reference",
  "first-review-evidence-checklist",
  "enterprise-onboarding",
  "governance-api-contracts",
  "repeat-review-loop",
  "accelerator-chooser",
  "cli-usage",
];

const EXPECTED_AUDIENCE_IDS: readonly string[] = [
  "procurement-packet",
  "configuration-reference",
  "first-review-evidence-checklist",
  "engineering-troubleshooting",
  "cli-usage",
  "enterprise-onboarding",
  "governance-api-contracts",
  "repeat-review-loop",
  "accelerator-chooser",
  "azure-boards-integration",
  "caiq-sig-response",
  "dpa-template",
  "subprocessors",
  "executive-summary-faq",
  "first-value-20-minutes",
  "evidence-intake",
  "evidence-trail",
  "choose-your-next-step",
  "pilot-feedback",
  "policy-pack-delta-demo",
  "prior-manifest-retrieval",
  "executive-summary-sponsor-brief",
  "soc2-self-assessment",
  "security-trust-trust-center",
];

const ALL_STAGE_NAMES = ["sourcePrestage", "contributorSections", "audience"] as const;

describe("help markdown topic rule stages", () => {
  it("pins source-prestage rule set order", () => {
    expect(HELP_MARKDOWN_TOPIC_RULE_STAGES.sourcePrestage.map((ruleSet) => ruleSet.id)).toEqual(
      EXPECTED_SOURCE_PRESTAGE_IDS,
    );
  });

  it("pins contributor-section rule set order", () => {
    expect(HELP_MARKDOWN_TOPIC_RULE_STAGES.contributorSections.map((ruleSet) => ruleSet.id)).toEqual(
      EXPECTED_CONTRIBUTOR_SECTION_IDS,
    );
  });

  it("pins audience rule set order", () => {
    expect(HELP_MARKDOWN_TOPIC_RULE_STAGES.audience.map((ruleSet) => ruleSet.id)).toEqual(
      EXPECTED_AUDIENCE_IDS,
    );
  });

  it("declares unique rule set ids within every stage", () => {
    for (const stageName of ALL_STAGE_NAMES) {
      const ids = HELP_MARKDOWN_TOPIC_RULE_STAGES[stageName].map((ruleSet) => ruleSet.id);

      expect(new Set(ids).size, stageName).toBe(ids.length);
    }
  });

  it("gives every rule set at least one transformation", () => {
    for (const stageName of ALL_STAGE_NAMES) {
      for (const ruleSet of HELP_MARKDOWN_TOPIC_RULE_STAGES[stageName]) {
        expect(ruleSet.rules.length, `${stageName}/${ruleSet.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("routes the accelerator chooser to its own rule set in both strip stages", () => {
    const context = {
      helpTopicSlug: "accelerator-chooser",
      normalizedSourcePath: "docs/library/accelerator_chooser.md",
    };

    expect(
      findHelpMarkdownTopicRuleSet(HELP_MARKDOWN_TOPIC_RULE_STAGES.contributorSections, context)?.id,
    ).toBe("accelerator-chooser");
    expect(findHelpMarkdownTopicRuleSet(HELP_MARKDOWN_TOPIC_RULE_STAGES.audience, context)?.id).toBe(
      "accelerator-chooser",
    );
  });

  it("prefers the procurement packet over the configuration reference when both could match", () => {
    const context = {
      helpTopicSlug: undefined,
      normalizedSourcePath: "docs/buyer_security_procurement_packet.md",
    };

    expect(findHelpMarkdownTopicRuleSet(HELP_MARKDOWN_TOPIC_RULE_STAGES.audience, context)?.id).toBe(
      "procurement-packet",
    );
  });

  it("leaves unrecognized topics without any topic-specific rule set", () => {
    const context = { helpTopicSlug: "unknown-topic", normalizedSourcePath: "docs/unknown_topic.md" };

    for (const stageName of ALL_STAGE_NAMES) {
      expect(
        findHelpMarkdownTopicRuleSet(HELP_MARKDOWN_TOPIC_RULE_STAGES[stageName], context),
        stageName,
      ).toBeNull();
    }
  });

  it("never matches the evidence-trail rule set, because its file name is compared case-sensitively", () => {
    // Documents a pre-existing defect carried through the registry refactor: normalizedSourcePath is
    // lower-cased, so the upper-case EVIDENCE_TRAIL_OPERATOR_GUIDE.md needle cannot match. Fixing it
    // changes rendered help copy, so it must be a deliberate change rather than a refactor side effect.
    const context = {
      helpTopicSlug: "evidence-trail",
      normalizedSourcePath: "docs/library/evidence_trail_operator_guide.md",
    };

    expect(findHelpMarkdownTopicRuleSet(HELP_MARKDOWN_TOPIC_RULE_STAGES.audience, context)).toBeNull();
  });
});
