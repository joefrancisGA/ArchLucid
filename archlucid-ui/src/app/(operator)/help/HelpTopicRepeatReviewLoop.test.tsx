import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const REPEAT_REVIEW_LOOP_SOURCE = "docs/library/REPEAT_REVIEW_LOOP.md";

/** TB-1396 — contributor / CLI / eng-doc leakage must not appear in `/help/repeat-review-loop`. */
const REPEAT_REVIEW_LOOP_HELP_BANNED_SUBSTRINGS = [
  "collect-first-pilot-proof",
  "API_CONTRACTS.md",
  "CORE_PILOT.md",
  "PRODUCT_LEARNING",
  "PRODUCT_PACKAGING.md",
  "fixtures/second-review",
  "SECOND_REVIEW_HABIT_LOOP_VALIDATION",
  "THREE_REAL_MODE_PROOF_RUNS",
  "GENERIC_AI_BAKEOFF_PROTOCOL",
  "Last reviewed",
  "TB-227",
] as const;

describe("HelpTopicRepeatReviewLoop (TB-1396)", () => {
  const loaded = tryLoadProductDocumentation("repeat-review-loop");

  it("loads REPEAT_REVIEW_LOOP.md from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("purges contributor CLI and eng-doc leakage from prepared and rendered repeat-review help (TB-1396)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(
      loaded.markdown,
      REPEAT_REVIEW_LOOP_SOURCE,
    ).toLowerCase();

    for (const banned of REPEAT_REVIEW_LOOP_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(
        banned.toLowerCase(),
      );
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    for (const banned of REPEAT_REVIEW_LOOP_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
  });

  it("keeps buyer-safe loop guidance and in-app help links (TB-1396)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getAllByRole("link", { name: /Compare and replay/i })[0]).toHaveAttribute(
      "href",
      "/help/comparison-replay",
    );
    expect(screen.getAllByRole("link", { name: /Your first architecture review/i })[0]).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
    expect(screen.getByRole("heading", { name: /Recommended loop/i })).toBeInTheDocument();
    expect(screen.queryByText(/collect-first-pilot-proof/i)).toBeNull();
  });
});
