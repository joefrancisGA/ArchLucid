import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/dpa-template",
}));

import { HelpDpaTemplateGuideView } from "@/app/(operator)/help/_sections/HelpDpaTemplateGuideView";
import {
  DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE,
  DPA_TEMPLATE_HELP_DOWNLOAD_ACTION,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
} from "@/lib/dpa-template-help-guide-content";
import {
  DPA_TEMPLATE_HELP_FOLLOW_UPS_TITLE,
  DPA_TEMPLATE_HELP_SOURCES,
} from "@/lib/dpa-template-help-evidence-copy";
import {
  DPA_TEMPLATE_HELP_FIRST_VIEWPORT_TEST_ID,
  DPA_TEMPLATE_HELP_SKIP_LINK_LABEL,
  DPA_TEMPLATE_HELP_SKIP_TARGET_ID,
} from "@/lib/dpa-template-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { resolvePublicHelpTopicPdfHref } from "@/lib/product-documentation-pdf-href";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpDpaTemplateGuideView buyer-polished shell (HDP)", () => {
  const loaded = tryLoadProductDocumentation("dpa-template");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected dpa-template documentation to load.");
    }

    render(<HelpDpaTemplateGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: DPA_TEMPLATE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DPA_TEMPLATE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-dpa-template-header-claim-discipline")).toHaveTextContent(
      DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-dpa-template-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-dpa-template-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-dpa-template-provenance")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DPA_TEMPLATE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-dpa-template-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-dpa-template-primary-content");
    const firstViewport = screen.getByTestId(DPA_TEMPLATE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-dpa-template-action-panel");
    const orientationBottom = screen.getByTestId("help-dpa-template-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-dpa-template-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.label }),
    ).toHaveAttribute("href", DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href);

    for (const source of DPA_TEMPLATE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    const downloadLink = screen.getByTestId("help-dpa-template-download-pdf");
    expect(downloadLink).toHaveAttribute("href", resolvePublicHelpTopicPdfHref(loaded.entry.slug));
    expect(downloadLink).toHaveTextContent(DPA_TEMPLATE_HELP_DOWNLOAD_ACTION.label);

    expect(screen.getByRole("heading", { level: 2, name: "Continue procurement diligence" })).toBeInTheDocument();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
