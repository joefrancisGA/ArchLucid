import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/configuration-reference",
}));

import { HelpConfigurationReferenceGuideView } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const CONFIGURATION_REFERENCE_SOURCE = "docs/library/CONFIGURATION_REFERENCE.md";

/** TB-1327 — contributor / RC / ADR / TB leakage must not appear in `/help/configuration-reference`. */
const CONFIGURATION_REFERENCE_HELP_BANNED_SUBSTRINGS = [
  "Contributor-reference",
  "TB-019",
  "TB-020",
  "TB-080",
  "TB-213",
  "TB-387",
  "Invoke-ConfigLintProofStep",
  "fixtures/release-candidate",
  "scripts/ci/",
  "scripts/run-readiness",
  "ADR 0038",
  "adrs/0038",
  "V1_SCOPE",
  "contributor-reference",
  "SECURITY.md",
  "SimulateLlmBudgetExhausted",
  "NEXT_PUBLIC_ARCHLUCID_CLARITY",
  "AllowRlsBypass",
  "InternalCrossTenantAnalytics",
] as const;

describe("HelpTopicMarkdownView configuration reference (TB-1327)", () => {
  const loaded = tryLoadProductDocumentation("configuration-reference");

  it("loads configuration reference markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("presentation strip removes contributor Scope banner and banned leakage", () => {
    if (loaded === null) {
      throw new Error("Expected configuration-reference documentation to load.");
    }

    const prepared = prepareHelpMarkdownForPresentation(loaded.markdown, CONFIGURATION_REFERENCE_SOURCE);
    const lower = prepared.toLowerCase();

    expect(lower).not.toContain("contributor-reference");
    expect(prepared).not.toMatch(/\bTB-\d+\b/i);

    for (const banned of CONFIGURATION_REFERENCE_HELP_BANNED_SUBSTRINGS) {
      expect(prepared, `banned substring still present: ${banned}`).not.toContain(banned);
    }

    expect(lower).not.toContain("testing (non-production)");
    expect(lower).not.toContain("public marketing site");
  });

  it("rendered specialty help body stays free of banned contributor leakage", () => {
    if (loaded === null) {
      throw new Error("Expected configuration-reference documentation to load.");
    }

    render(<HelpConfigurationReferenceGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-configuration-reference-guide")).toBeInTheDocument();

    const visible = document.body.textContent ?? "";

    for (const banned of CONFIGURATION_REFERENCE_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `banned substring still rendered: ${banned}`).not.toContain(banned);
    }

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
    expect(visible.toLowerCase()).not.toContain("contributor-reference —");
  });
});
