/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <button type="button">{triggerText ?? "Help"}</button>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/approval-requests/claims-intake-approval-001/lineage",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./GovernanceApprovalLineageNextRequestFooterClient", () => ({
  GovernanceApprovalLineageNextRequestFooterClient: () => (
    <div data-testid="approval-lineage-next-request-footer" />
  ),
}));

vi.mock("@/app/(operator)/governance/_sections/GovernanceApprovalQueueNextReviewFooterClient", () => ({
  GovernanceApprovalQueueNextReviewFooterClient: () => (
    <div data-testid="approval-lineage-next-review-footer" />
  ),
}));

import {
  APPROVAL_LINEAGE_BUYER_START_HERE_HELPER,
  APPROVAL_LINEAGE_CLAIM_DISCIPLINE,
  APPROVAL_LINEAGE_FOLLOW_UPS_TITLE,
  APPROVAL_LINEAGE_PAGE_LEAD,
  APPROVAL_LINEAGE_PRIMARY_CONTENT_ID,
  APPROVAL_LINEAGE_SKIP_LINK_LABEL,
  APPROVAL_LINEAGE_SOURCES,
  APPROVAL_LINEAGE_START_HERE_CARD_TITLE,
} from "@/lib/approval-lineage-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { GovernanceApprovalLineagePageView } from "./GovernanceApprovalLineagePageView";
import type { UseGovernanceApprovalLineagePageModel } from "./use-governance-approval-lineage-page";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

function sampleLineage(): GovernanceLineageResult {
  return {
    approvalRequest: {
      approvalRequestId: "claims-intake-approval-001",
      runId: "customer-intake-modernization",
      manifestVersion: "3.4.1",
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      status: "Approved",
      requestedBy: "Alex Kim",
      reviewedBy: "Taylor Morgan",
      requestComment: "Promote claims intake modernization",
      reviewComment: null,
      requestedUtc: "2026-01-14T20:00:00.000Z",
      reviewedUtc: "2026-01-14T22:00:00.000Z",
    },
    run: {
      runId: "customer-intake-modernization",
      status: "Finalized",
      createdUtc: "2026-01-12T10:00:00.000Z",
      completedUtc: "2026-01-14T22:00:00.000Z",
      currentManifestVersion: "3.4.1",
    },
    manifest: null,
    topFindings: [],
    riskPosture: "Approved with monitoring",
    promotions: [],
  };
}

function buyerModel(data: GovernanceLineageResult): UseGovernanceApprovalLineagePageModel {
  return {
    approvalRequestId: data.approvalRequest.approvalRequestId,
    buyerPolishedShell: true,
    data,
    failure: null,
    load: vi.fn(),
    loading: false,
    nextDemo: false,
  };
}

describe("GovernanceApprovalLineagePageView buyer-polished chrome (GAI)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders skip link, header claim discipline, and bottom Sources after body", () => {
    render(<GovernanceApprovalLineagePageView model={buyerModel(sampleLineage())} />);

    expect(screen.getByRole("link", { name: APPROVAL_LINEAGE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${APPROVAL_LINEAGE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("approval-lineage-claim-discipline")).toHaveTextContent(
      APPROVAL_LINEAGE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("approval-lineage-intro")).toHaveTextContent(APPROVAL_LINEAGE_PAGE_LEAD);
    expect(screen.getByTestId("approval-lineage-buyer-start-here-helper")).toHaveTextContent(
      APPROVAL_LINEAGE_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: APPROVAL_LINEAGE_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("approval-lineage-queue-vocabulary")).not.toBeInTheDocument();

    const primary = screen.getByTestId("approval-lineage-primary-content");
    const spine = screen.getByTestId("approval-lineage-spine");
    const orientation = screen.getByTestId("approval-lineage-orientation-bottom");

    expect(primary).toContainElement(spine);
    expect(primary).toContainElement(orientation);
    expect(spine.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("heading", { level: 2, name: APPROVAL_LINEAGE_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("approval-lineage-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(APPROVAL_LINEAGE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
