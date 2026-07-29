import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const EVALUATOR_WORKBOOK_SOURCE = "docs/onboarding/EVALUATOR_WORKBOOK.md";

/** TB-1346 — CLI / runbook / eng jargon must not appear in `/help/evaluator-workbook`. */
const EVALUATOR_WORKBOOK_HELP_BANNED_SUBSTRINGS = [
  "collect-first-pilot-proof",
  "ArchLucid.Cli",
  "ARCHLUCID_API_URL",
  "PilotStrict",
  "Tier-1",
  "authority pipeline",
  "BUYER_FIRST_30_MINUTES.md",
  "SECOND_RUN.md",
  "FIRST_PILOT_OPERATOR_PATH.md",
  "FIRST_PILOT_TROUBLESHOOTING.md",
  "./scripts/",
] as const;

describe("HelpTopicMarkdownView evaluator workbook (TB-1346)", () => {
  const loaded = tryLoadProductDocumentation("evaluator-workbook");

  it("loads evaluator workbook markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("presentation strip removes CLI, runbook filenames, and eng jargon", () => {
    if (loaded === null) {
      throw new Error("Expected evaluator-workbook documentation to load.");
    }

    const prepared = prepareHelpMarkdownForPresentation(loaded.markdown, EVALUATOR_WORKBOOK_SOURCE);

    for (const banned of EVALUATOR_WORKBOOK_HELP_BANNED_SUBSTRINGS) {
      expect(prepared, `banned substring still present: ${banned}`).not.toContain(banned);
    }

    expect(prepared).toContain("/help/core-pilot");
    expect(prepared).toContain("architecture analysis");
    expect(prepared).toContain("optional cloud inventory");
    expect(prepared).toContain("pilot host integrity");
  });

  it("rendered help body stays free of banned CLI and runbook leakage", () => {
    if (loaded === null) {
      throw new Error("Expected evaluator-workbook documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("article")).toBeInTheDocument();

    const visible = document.body.textContent ?? "";

    for (const banned of EVALUATOR_WORKBOOK_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }
  });
});
