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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

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

  it("shows inbox-only triage surface with concise orientation copy", () => {
    render(<AlertsHubClient />);
    expect(screen.getByTestId("stub-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-page-title")).toHaveTextContent("Alert inbox");
    expect(screen.getByText(ALERTS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
    expect(screen.getByTestId("alerts-how-alerts-work-link")).toHaveAttribute("href", "/help/alerts");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
});
