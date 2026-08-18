import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tabValue: { current: string | null } = { current: null };
const push = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push }),
    usePathname: () => "/governance/alerts",
    useSearchParams: () => ({
      get: (k: string) => (k === "tab" ? tabValue.current : null),
    }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
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
    callerAuthorityRank: 2,
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

import { ALERTS_CONTEXT_NOTE, ALERTS_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { AlertsHubClient } from "./AlertsHubClient";

describe("AlertsHubClient", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows inbox-only triage surface with concise orientation copy", async () => {
    render(<AlertsHubClient />);
    expect(screen.getByTestId("stub-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-page-title")).toHaveTextContent("Alerts");
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByText(ALERTS_PAGE_SUBTITLE)).toBeInTheDocument();
    // The governance context panel is a deferred chunk, so orientation copy paints after the header.
    expect(await screen.findByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-configure-rules-link")).toHaveAttribute("href", "/governance/alert-rules");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alerts-how-alerts-work-link")).toBeNull();
  });
});
