import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tabValue: { current: string | null } = { current: null };
const push = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push }),
    useSearchParams: () => ({
      get: (k: string) => (k === "tab" ? tabValue.current : null),
    }),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Governance",
      headline: "Metric thresholds that raise alerts after scans.",
      useWhen: "Define thresholds here; triage fired alerts on Alerts.",
      firstPilotNote: null,
      enterpriseFootnote: "Thresholds on scan outcomes.",
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

vi.mock(
  "@/app/(operator)/governance/alert-rules/_sections/alert-rules-hub-deferred-chunks",
  () => ({
    AlertRulesContentDeferred: () => <div data-testid="stub-rules" />,
    AlertRoutingContentDeferred: () => <div data-testid="stub-routing" />,
    CompositeAlertRulesContentDeferred: () => <div data-testid="stub-composite" />,
    AlertSimulationTuningSectionDeferred: () => <div data-testid="stub-simulation" />,
  }),
);

import {
  ALERTS_CONFIGURATION_PAGE_SUBTITLE,
  BUYER_ALERTS_CONFIGURATION_PAGE_SUBTITLE,
} from "@/lib/alerts-page-copy";
import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance/governance-overview-copy";

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient buyer-polished shell", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  it("uses buyer subtitle, refresh, and omits About layer/scope chrome", () => {
    render(<AlertRulesHubClient />);

    expect(screen.getByText(BUYER_ALERTS_CONFIGURATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(ALERTS_CONFIGURATION_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("layer-header-collapsible-guidance")).toBeNull(); // TB-2093
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-scope-details")).toBeNull(); // TB-2093
    expect(screen.queryByText(GOVERNANCE_OVERVIEW_PAGE_LEAD)).not.toBeInTheDocument();
  });
});
