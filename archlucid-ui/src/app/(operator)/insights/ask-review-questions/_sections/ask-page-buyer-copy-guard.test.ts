import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ASK_SECTION_PATHS = [
  "src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskMainPanel.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskQuestionForm.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskReviewScopeStrip.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskMessageThreadPanel.tsx",
] as const;

const ASK_BANNED_CUSTOMER_PHRASES: readonly string[] = [
  "returned from the api",
  "api service",
  "backend",
  "operator mode",
  "fallback",
  "seed",
  "sample selected",
] as const;

/** Quoted literals and JSX text nodes — excludes identifiers and prop names. */
function extractUserFacingStringLiterals(source: string): string {
  const quoted = [
    ...source.matchAll(/"(?:\\.|[^"\\])*"/g),
    ...source.matchAll(/'(?:\\.|[^'\\])*'/g),
    ...source.matchAll(/`(?:\\.|[^`\\])*`/g),
  ].map((match) => match[0].slice(1, -1));

  return quoted.join("\n").toLowerCase();
}

describe("ask page buyer copy guard", () => {
  it("keeps ask section sources free of internal API language", () => {
    const corpus = ASK_SECTION_PATHS.map((relativePath) =>
      extractUserFacingStringLiterals(readFileSync(join(process.cwd(), relativePath), "utf8")),
    ).join("\n");

    const violations = ASK_BANNED_CUSTOMER_PHRASES.filter((phrase) => corpus.includes(phrase));

    expect(violations).toEqual([]);
  });
});
