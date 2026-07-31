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
      layerBadge: "Governance",
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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/alerts/AlertsInboxContent", () => ({
  AlertsInboxContent: () => <div data-testid="stub-inbox" />,
}));

import { BUYER_ALERTS_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { AlertsHubClient } from "./AlertsHubClient";

describe("AlertsHubClient buyer-polished chrome", () => {
  it("uses collapsible layer guidance and header configure link without duplicate context panel", () => {
    render(<AlertsHubClient />);

    expect(screen.getByTestId("layer-header-collapsible-guidance")).toBeInTheDocument();
    expect(screen.getByText(BUYER_ALERTS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure alert rules" })).toHaveAttribute(
      "href",
      "/governance/alert-rules",
    );
    expect(screen.queryByTestId("alerts-governance-context-panel")).toBeNull();
  });
});
