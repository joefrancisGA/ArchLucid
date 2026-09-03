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
      layerBadge: "Approval",
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
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
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

vi.mock("@/components/alerts/use-alert-rules-hub-queries", () => ({
  useAlertRulesListQuery: () => ({
    items: [{ id: "rule-1" }],
    loading: false,
    failure: null,
    refresh: vi.fn(async () => undefined),
  }),
  useAlertRoutingSubscriptionsQuery: () => ({
    items: [],
    loading: false,
    failure: null,
    refresh: vi.fn(async () => undefined),
  }),
  useCompositeAlertRulesListQuery: () => ({
    items: [],
    loading: false,
    failure: null,
    refresh: vi.fn(async () => undefined),
  }),
}));

import {
  ALERTS_CONFIGURATION_PAGE_SUBTITLE,
  BUYER_ALERTS_CONFIGURATION_PAGE_SUBTITLE,
} from "@/lib/alerts-page-copy";
import { ALERT_RULES_CLAIM_DISCIPLINE, ALERT_RULES_FOLLOW_UPS_TITLE } from "@/lib/alert-rules-evidence-copy";
import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance/governance-overview-copy";
import {
  ALERT_RULES_HUB_FIRST_VIEWPORT_ID,
  ALERT_RULES_HUB_SKIP_LINK_LABEL,
  ALERT_RULES_HUB_SKIP_TARGET_ID,
} from "./alert-rules-hub-page-copy";

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient buyer-polished shell (GOT)", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = "test-alerts";
  });

  it("renders skip link, workspace before follow-ups, buyer subtitle, and keeps contextual help", () => {
    render(<AlertRulesHubClient />);

    expect(screen.getByRole("link", { name: ALERT_RULES_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ALERT_RULES_HUB_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(BUYER_ALERTS_CONFIGURATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(ALERTS_CONFIGURATION_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("layer-header-collapsible-guidance")).toBeNull(); // TB-2093
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-scope-details")).toBeNull(); // TB-2093
    expect(screen.queryByText(GOVERNANCE_OVERVIEW_PAGE_LEAD)).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-hub-claim-discipline")).toHaveTextContent(
      ALERT_RULES_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: ALERT_RULES_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-hub-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-setup-config-hubs-vocabulary")).toBeNull();

    const primaryContent = screen.getByTestId("alert-rules-hub-primary-content");
    const firstViewport = screen.getByTestId(ALERT_RULES_HUB_FIRST_VIEWPORT_ID);
    const simulationPanel = screen.getByTestId("stub-simulation");
    const orientationBottom = screen.getByTestId("alert-rules-hub-orientation-bottom");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(simulationPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
