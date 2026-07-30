import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const PILOT_ROI_MODEL_SOURCE = "docs/library/PILOT_ROI_MODEL.md";

/** TB-1390 — contributor / library spine leakage must not appear in `/help/pilot-roi-model`. */
const PILOT_ROI_MODEL_HELP_BANNED_SUBSTRINGS = [
  "START_HERE",
  "V1_SCOPE.md",
  "CORE_PILOT.md",
  "REPOSITORY_README",
  "archive/gtm-internal",
  "OPERATOR_DECISION_GUIDE",
  "PRODUCT_PACKAGING",
  "CLI copy",
  "CI strings",
  "docs/go-to-market",
  "docs/library/PILOT_ROI_MODEL.md",
] as const;

describe("HelpTopicPilotRoiModel (TB-1390)", () => {
  const loaded = tryLoadProductDocumentation("pilot-roi-model");

  it("loads PILOT_ROI_MODEL.md from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("purges contributor spine leakage from prepared and rendered pilot ROI help (TB-1390)", () => {
    if (loaded === null) {
      throw new Error("Expected pilot-roi-model documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(
      loaded.markdown,
      PILOT_ROI_MODEL_SOURCE,
    ).toLowerCase();

    for (const banned of PILOT_ROI_MODEL_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(
        banned.toLowerCase(),
      );
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    for (const banned of PILOT_ROI_MODEL_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
  });

  it("keeps buyer-safe pilot measurement links in rendered pilot ROI help (TB-1390)", () => {
    if (loaded === null) {
      throw new Error("Expected pilot-roi-model documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: /Pilot success scorecard/i })).toHaveAttribute(
      "href",
      "/help/pilot-guide#pilot-roi-measurement",
    );
    expect(screen.getByRole("link", { name: /ROI model/i })).toHaveAttribute(
      "href",
      "/help/executive-summary",
    );
  });
});
