import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  ALERT_ROUTING_TAB_BUYER_START_HERE_HELPER,
  ALERT_ROUTING_TAB_PAGE_LEAD,
} from "@/lib/alert-routing-tab-copy";
import { AlertRulesHubRefreshProvider } from "@/lib/alerts-hub-refresh-context";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: vi.fn().mockResolvedValue([]),
  createAlertRoutingSubscription: vi.fn(),
  toggleAlertRoutingSubscription: vi.fn(),
  listAlertRoutingDeliveryAttempts: vi.fn(),
  testWebhookSubscription: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/alert-rules",
  useSearchParams: () => new URLSearchParams("tab=notifications&runId=run-routing-buyer"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";

function renderWithHub(ui: React.ReactElement): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AlertRulesHubRefreshProvider activeTab="notifications">
        {ui}
      </AlertRulesHubRefreshProvider>
    </QueryClientProvider>,
  );
}

describe("AlertRoutingContent buyer-polished shell (GON)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first-viewport intro, hides rank cue and provenance, mounts tab Sources chrome", async () => {
    renderWithHub(<AlertRoutingContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-routing-first-viewport")).toBeInTheDocument();
    });

    expect(screen.getByTestId("alert-routing-intro")).toHaveTextContent(ALERT_ROUTING_TAB_PAGE_LEAD);
    expect(screen.getByTestId("alert-routing-buyer-start-here-helper")).toHaveTextContent(
      ALERT_ROUTING_TAB_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-routing-config-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-routing-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("alert-routing-sources")).toBeInTheDocument();
  });
});
