import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("@/hooks/use-admin-identity-providers-bundle-query", () => ({
  useAdminIdentityProvidersBundleQuery: () => ({ data: null, isPending: true }),
}));

vi.mock("@/hooks/use-admin-config-lint-summary-query", () => ({
  useAdminConfigLintSummaryQuery: () => ({ data: undefined, isPending: true }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/configuration-reference",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpConfigurationReferenceGuideView } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView";
import {
  CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE,
  CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS,
} from "@/lib/configuration-reference-help-guide-content";
import {
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX,
} from "@/lib/configuration-reference-help-ia-dual";
import { CONFIGURATION_REFERENCE_HELP_RELATED_TEST_ID } from "@/lib/configuration-reference-help-related-guides";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { expectClaimDisciplineBandContent } from "@/lib/claim-discipline-test-helpers";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

/** TB-1330 — product presentation must not keep eng-library hrefs. */
const CONFIGURATION_REFERENCE_BANNED_HREF_FRAGMENTS = [
  "contributor-reference/",
  "architecture/adrs/",
  "scripts/",
  "../runbooks/",
  "runbooks/",
] as const;

describe("HelpConfigurationReferenceGuideView", () => {
  const loaded = tryLoadProductDocumentation("configuration-reference");

  it("loads configuration reference help from the library catalog source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("configuration-reference");
  });

  it("renders specialty Admin chrome with settings CTAs and collapsed catalog (TB-1326 / TB-1328)", () => {
    if (loaded === null) {
      throw new Error("Expected configuration-reference documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "configuration-reference",
    });

    render(<HelpConfigurationReferenceGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-configuration-reference-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-configuration-reference-task-sections")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-configuration-reference-provenance-footer")).toBeInTheDocument();
    expect(screen.queryByTestId("help-configuration-reference-claim-discipline")).toBeNull();
    expect(screen.getByTestId("help-configuration-reference-claim-discipline-strip")).toHaveTextContent(
      CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-configuration-reference",
      "help-configuration-reference-claim-discipline",
      CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-configuration-reference-job-matrix-current")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("help-configuration-reference-job-matrix-current")).toHaveTextContent(
      CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.find((row) => row.isCurrent === true)?.label ?? "",
    );
    expect(screen.queryByTestId(CONFIGURATION_REFERENCE_HELP_RELATED_TEST_ID)).toBeNull();

    const appendix = screen.getByTestId("help-configuration-reference-catalog-appendix");

    expect(appendix.tagName.toLowerCase()).toBe("details");
    expect(appendix).not.toHaveAttribute("open");
    expect(screen.getByTestId("help-configuration-reference-catalog-filter")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-configuration-reference-action-panel");
    const claimStrip = screen.getByTestId("help-configuration-reference-claim-discipline-strip");

    expect(claimStrip.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.className).not.toMatch(/bg-teal-/);
    expect(actionPanel.className).not.toMatch(/border-teal-/);

    const ssoLink = within(actionPanel).getByRole("link", {
      name: CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.label,
    });

    expect(ssoLink).toHaveAttribute("href", CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.href);
    expect(ssoLink.className).not.toMatch(/bg-al-accent/);

    expect(
      within(actionPanel).getByRole("link", {
        name: CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.label,
      }),
    ).toHaveAttribute("href", CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.href);

    expect(
      within(actionPanel).getByRole("link", {
        name: CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.label,
      }),
    ).toHaveAttribute("href", CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.href);

    expect(within(actionPanel).getAllByLabelText(/^Status:/)).toHaveLength(3);

    expect(screen.getByText("Not available in product")).toBeInTheDocument();

    const jobMatrix = screen.getByTestId(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID);
    const matrixLinks = within(jobMatrix).getAllByRole("link");

    for (const link of matrixLinks) {
      expect(link.getAttribute("href")).not.toBe("#");
    }

    expect(
      within(actionPanel).queryByRole("link", {
        name: "API keys",
      }),
    ).toBeNull();

    expect(screen.queryByTestId("help-configuration-reference-sources")).toBeNull(); // TB-2092

    for (const banned of CONFIGURATION_REFERENCE_BANNED_HREF_FRAGMENTS) {
      expect(preparedMarkdown, `banned href fragment still present: ${banned}`).not.toContain(`](${banned}`);
      expect(preparedMarkdown, `banned href fragment still present: ${banned}`).not.toMatch(
        new RegExp(`\\]\\([^)]*${banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
      );
    }
  });
});
