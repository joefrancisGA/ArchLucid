import { describe, expect, it } from "vitest";

import { applyHelpMarkdownPresentationRules } from "@/lib/help-markdown-presentation-pipeline";

describe("help-markdown-presentation-pipeline", () => {
  it("applies rules in declaration order", () => {
    const result = applyHelpMarkdownPresentationRules("start", [
      (markdown) => `${markdown}-first`,
      (markdown) => `${markdown}-second`,
    ]);

    expect(result).toBe("start-first-second");
  });
});
