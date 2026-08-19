/** A single ordered markdown transformation in the buyer-help presentation pipeline. */
export type HelpMarkdownPresentationRule = (markdown: string) => string;

/** What a help topic is identified by: its registry slug and the repo doc it was sourced from. */
export interface HelpMarkdownTopicContext {
  readonly helpTopicSlug: string | undefined;
  /** Source doc path, already lowercased with backslashes normalized to `/`. */
  readonly normalizedSourcePath: string;
}

/**
 * Rules that apply to one help topic at one pipeline stage.
 * Rule sets are resolved first-match-wins, so declaration order within a stage is significant.
 */
export interface HelpMarkdownTopicRuleSet {
  /** Stable identifier for tests and failure messages; not rendered. */
  readonly id: string;
  readonly matches: (context: HelpMarkdownTopicContext) => boolean;
  readonly rules: readonly HelpMarkdownPresentationRule[];
}

/**
 * Applies markdown transformations in declaration order.
 * Rule order is intentional because a later transform can depend on earlier cleanup.
 */
export function applyHelpMarkdownPresentationRules(
  markdown: string,
  rules: readonly HelpMarkdownPresentationRule[],
): string {
  return rules.reduce(
    (currentMarkdown, rule) => rule(currentMarkdown),
    markdown,
  );
}

/**
 * Finds the first rule set matching the topic. Returns null rather than an empty set so callers
 * can tell "no topic-specific handling" apart from "matched a topic that declares no rules".
 */
export function findHelpMarkdownTopicRuleSet(
  ruleSets: readonly HelpMarkdownTopicRuleSet[],
  context: HelpMarkdownTopicContext,
): HelpMarkdownTopicRuleSet | null {
  return ruleSets.find((ruleSet) => ruleSet.matches(context)) ?? null;
}

/** Applies the first matching topic rule set for a stage, leaving markdown untouched when none match. */
export function applyHelpMarkdownTopicRules(
  markdown: string,
  ruleSets: readonly HelpMarkdownTopicRuleSet[],
  context: HelpMarkdownTopicContext,
): string {
  const matched = findHelpMarkdownTopicRuleSet(ruleSets, context);

  if (matched === null) {
    return markdown;
  }

  return applyHelpMarkdownPresentationRules(markdown, matched.rules);
}
