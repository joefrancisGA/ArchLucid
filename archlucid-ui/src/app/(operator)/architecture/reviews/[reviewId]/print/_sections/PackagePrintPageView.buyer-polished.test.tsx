import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("./PackagePrintNextReviewFooterClient", () => ({
  PackagePrintNextReviewFooterClient: () => <div data-testid="package-print-next-review-footer-stub" />,
}));

vi.mock("@/hooks/use-working-back-locator", () => ({
  useWorkingBackLocator: () => ({
    reviewJobHref:
      "/architecture/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa?reviewTab=review-package",
    architectureDeskHref: null,
  }),
}));

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { PACKAGE_PRINT_CLAIM_DISCIPLINE, buildPackagePrintSources } from "@/lib/package-print-evidence-copy";
import {
  PACKAGE_PRINT_FIRST_VIEWPORT_ID,
  PACKAGE_PRINT_PAGE_SUBTITLE_BUYER,
  PACKAGE_PRINT_PRIMARY_CONTENT_ID,
  PACKAGE_PRINT_SKIP_LINK_LABEL,
  PACKAGE_PRINT_SKIP_TARGET_ID,
} from "@/lib/package-print-page-copy";
import type { PackagePrintPresentation } from "@/lib/package-print-view";

import { PackagePrintPageView } from "./PackagePrintPageView";

const runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const presentation: PackagePrintPresentation = {
  title: "Payments edge",
  statusLabel: "Finalized",
  statusKind: "approved",
  findingsSummary: "3 findings",
  sponsorSynopsis: "Sponsor synopsis",
  createdUtc: "2026-01-15T12:00:00.000Z",
  runId,
  manifestVersionForGuard: "manifest-1",
};

describe("PackagePrintPageView buyer-polished shell (APR)", () => {
  it("renders skip link, first-viewport band, orientation above summary, claim discipline, and Sources links", () => {
    render(<PackagePrintPageView presentation={presentation} />);

    expect(screen.getByRole("link", { name: PACKAGE_PRINT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PACKAGE_PRINT_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(PACKAGE_PRINT_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("package-print-claim-discipline").textContent).toContain(
      PACKAGE_PRINT_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("package-print-instructions")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(PACKAGE_PRINT_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PACKAGE_PRINT_FIRST_VIEWPORT_ID);
    const workspaceHeader = screen.getByTestId("package-print-workspace-header");
    const orientationTop = screen.getByTestId("package-print-orientation-top");
    const statusTag = screen.getByTestId("package-print-status");
    const sourcesSection = screen.getByTestId("package-print-sources");

    expect(primaryContent).toHaveAttribute("id", PACKAGE_PRINT_PRIMARY_CONTENT_ID);
    expect(primaryContent).toContainElement(workspaceHeader);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(workspaceHeader);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(statusTag);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(statusTag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(buildPackagePrintSources(runId))) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
