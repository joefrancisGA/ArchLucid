/** A single ordered markdown transformation in the buyer-help presentation pipeline. */
export type HelpMarkdownPresentationRule = (markdown: string) => string;

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
