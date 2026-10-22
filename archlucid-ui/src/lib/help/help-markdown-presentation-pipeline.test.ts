import { describe, expect, it } from "vitest";

import type {
  HelpMarkdownTopicContext,
  HelpMarkdownTopicRuleSet,
} from "@/lib/help/help-markdown-presentation-pipeline";
import {
  applyHelpMarkdownPresentationRules,
  applyHelpMarkdownTopicRules,
  findHelpMarkdownTopicRuleSet,
} from "@/lib/help/help-markdown-presentation-pipeline";

function contextFor(slug: string | undefined, sourcePath: string): HelpMarkdownTopicContext {
  return { helpTopicSlug: slug, normalizedSourcePath: sourcePath };
}

const SLUG_RULE_SETS: readonly HelpMarkdownTopicRuleSet[] = [
  {
    id: "first",
    matches: (context) => context.helpTopicSlug === "alpha",
    rules: [(markdown) => `${markdown}-first`],
  },
  {
    id: "second",
    matches: (context) => context.helpTopicSlug === "alpha",
    rules: [(markdown) => `${markdown}-second`],
  },
  {
    id: "by-source",
    matches: (context) => context.normalizedSourcePath.includes("beta.md"),
    rules: [(markdown) => `${markdown}-beta`, (markdown) => `${markdown}-beta-two`],
  },
];

describe("help-markdown-presentation-pipeline", () => {
  it("applies rules in declaration order", () => {
    const result = applyHelpMarkdownPresentationRules("start", [
      (markdown) => `${markdown}-first`,
      (markdown) => `${markdown}-second`,
    ]);

    expect(result).toBe("start-first-second");
  });

  it("applies no transformation for an empty rule list", () => {
    expect(applyHelpMarkdownPresentationRules("start", [])).toBe("start");
  });
});

describe("findHelpMarkdownTopicRuleSet", () => {
  it("returns the first matching rule set so declaration order decides ties", () => {
    const matched = findHelpMarkdownTopicRuleSet(SLUG_RULE_SETS, contextFor("alpha", "alpha.md"));

    expect(matched?.id).toBe("first");
  });

  it("matches on the normalized source path when the slug does not match", () => {
    const matched = findHelpMarkdownTopicRuleSet(SLUG_RULE_SETS, contextFor(undefined, "docs/beta.md"));

    expect(matched?.id).toBe("by-source");
  });

  it("returns null when no rule set matches", () => {
    expect(findHelpMarkdownTopicRuleSet(SLUG_RULE_SETS, contextFor("gamma", "gamma.md"))).toBeNull();
  });
});

describe("applyHelpMarkdownTopicRules", () => {
  it("applies only the first matching rule set", () => {
    const result = applyHelpMarkdownTopicRules("start", SLUG_RULE_SETS, contextFor("alpha", "alpha.md"));

    expect(result).toBe("start-first");
  });

  it("applies every rule of the matched set in declaration order", () => {
    const result = applyHelpMarkdownTopicRules("start", SLUG_RULE_SETS, contextFor(undefined, "docs/beta.md"));

    expect(result).toBe("start-beta-beta-two");
  });

  it("leaves markdown untouched when no rule set matches", () => {
    expect(applyHelpMarkdownTopicRules("start", SLUG_RULE_SETS, contextFor("gamma", "gamma.md"))).toBe("start");
  });
});
