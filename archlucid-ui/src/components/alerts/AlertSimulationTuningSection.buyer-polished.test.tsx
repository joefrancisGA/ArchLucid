import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALERT_TEST_ALERTS_TAB_BUYER_START_HERE_HELPER,
  ALERT_TEST_ALERTS_TAB_PAGE_LEAD,
} from "@/lib/alert-test-alerts-tab-copy";

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

vi.mock("@/components/alerts/AlertSimulationContent", () => ({
  AlertSimulationContent: () => <div data-testid="stub-alert-simulation-content">Simulation</div>,
}));

vi.mock("@/components/alerts/AlertTuningContent", () => ({
  AlertTuningContent: () => <div data-testid="stub-alert-tuning-content">Tuning</div>,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      replace: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => "/governance/alert-rules",
    useSearchParams: () => new URLSearchParams("tab=test-alerts&runId=run-tune-1"),
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";

describe("AlertSimulationTuningSection buyer-polished shell (GOT)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first-viewport intro, hides rank cue and operator tab lead, mounts tab Sources chrome", () => {
    render(<AlertSimulationTuningSection />);

    expect(screen.getByTestId("alert-test-alerts-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("alert-test-alerts-intro")).toHaveTextContent(ALERT_TEST_ALERTS_TAB_PAGE_LEAD);
    expect(screen.getByTestId("alert-test-alerts-buyer-start-here-helper")).toHaveTextContent(
      ALERT_TEST_ALERTS_TAB_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByTestId("alert-test-alerts-dry-run-tag")).toHaveTextContent("Dry run");
    expect(screen.queryByTestId("alert-test-alerts-tab-lead")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-test-alerts-tab-rank-cue")).not.toBeInTheDocument();
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-test-alerts-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("alert-test-alerts-sources")).toBeInTheDocument();
  });
});
