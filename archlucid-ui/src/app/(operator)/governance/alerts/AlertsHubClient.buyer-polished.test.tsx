import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Approval",
      headline: "Risk and compliance signals that need triage.",
      useWhen: "Work the inbox first; configure rules and routing on Alert rules.",
      firstPilotNote: null,
      enterpriseFootnote: "Inbox first; configuration tabs when your role allows.",
    },
    contextHints: {
      enterpriseNavGroupHint: "",
      enterpriseExecutePageHint: null,
      layerHeaderEnterpriseRankCue: null,
      governanceResolutionRank: "",
      alertsInboxRank: "",
      auditLogRank: "",
      alertOperatorToolingRank: "",
      governanceDashboardReaderAction: null,
    },
    callerAuthorityRank: 0,
    showExtended: true,
    showAdvanced: true,
    mounted: true,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/alerts/AlertsInboxContent", () => ({
  AlertsInboxContent: () => <div data-testid="stub-inbox" />,
}));

import { BUYER_ALERTS_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import {
  ALERTS_INBOX_CLAIM_HEADING,
  ALERTS_INBOX_FOLLOW_UPS_TITLE,
} from "@/lib/alerts-inbox-evidence-copy";
import {
  ALERTS_INBOX_PRIMARY_CONTENT_ID,
  ALERTS_INBOX_SKIP_LINK_LABEL,
} from "@/lib/alerts-inbox-page-copy";
import { AlertsHubChrome } from "./AlertsHubChrome";
import { AlertsHubClient } from "./AlertsHubClient";

describe("AlertsHubClient buyer-polished chrome", () => {
  it("renders skip link, breadcrumb, and orientation after the inbox body", () => {
    render(<AlertsHubClient />);

    expect(screen.getByRole("link", { name: ALERTS_INBOX_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ALERTS_INBOX_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("alerts-inbox-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ALERTS_INBOX_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const orientation = screen.getByTestId("alerts-inbox-orientation-top");
    const inbox = screen.getByTestId("stub-inbox");
    const primary = screen.getByTestId("alerts-inbox-primary-content");

    expect(primary).toContainElement(inbox);
    expect(primary).toContainElement(orientation);

    const orderedTestIds = Array.from(primary.querySelectorAll("[data-testid]")).map((element) =>
      element.getAttribute("data-testid"),
    );
    const orientationIndex = orderedTestIds.indexOf("alerts-inbox-orientation-top");
    const inboxIndex = orderedTestIds.indexOf("stub-inbox");

    expect(inboxIndex).toBeGreaterThan(-1);
    expect(orientationIndex).toBeGreaterThan(inboxIndex);
    expect(inbox.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the buyer subtitle, help control, and header configure link by default", () => {
    render(<AlertsHubClient />);

    expect(screen.getByText(BUYER_ALERTS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure alert rules" })).toHaveAttribute(
      "href",
      "/governance/alert-rules",
    );
    expect(screen.queryByTestId("alerts-governance-context-panel")).toBeNull();
  });

  it("suppresses the header configure link when the inbox owns the no_rules primary CTA", () => {
    render(
      <AlertsHubChrome showHeaderConfigureLink={false}>
        <div data-testid="stub-inbox" />
      </AlertsHubChrome>,
    );

    expect(screen.queryByTestId("alerts-configure-rules-link")).toBeNull();
    expect(screen.queryByRole("link", { name: "Configure alert rules" })).toBeNull();
  });
});
