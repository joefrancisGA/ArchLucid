import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listRunsByProjectPaged = vi.fn();
const getPilotScorecard = vi.fn();

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: (...args: unknown[]) => listRunsByProjectPaged(...args),
  getPilotScorecard: (...args: unknown[]) => getPilotScorecard(...args),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/HomeFirstRunWorkflowGate", () => ({
  HomeFirstRunWorkflowGate: () => (
    <div data-testid="first-run-panel-mock" aria-hidden>
      First-run panel mock
    </div>
  ),
}));

vi.mock("@/components/WelcomeBanner", () => ({
  WelcomeBanner: () => <div data-testid="welcome-banner-mock">Welcome mock</div>,
}));

vi.mock("@/components/ValueRealizationDashboard", () => ({
  ValueRealizationDashboard: () => <div data-testid="value-realization-dashboard-mock" aria-hidden />,
}));

vi.mock("@/components/TrialWelcomeRunDeepLink", () => ({
  TrialWelcomeRunDeepLink: () => null,
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/PilotOutcomeCard", () => ({
  PilotOutcomeCard: () => <div data-testid="pilot-outcome-mock" aria-hidden />,
}));

vi.mock("@/components/operator-home/OperationalMetricsGate", () => ({
  OperationalMetricsGate: ({ children }: { children: import("react").ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: import("react").ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator-static-demo")>();

  return {
    ...actual,
    tryStaticDemoRunSummariesPaged: vi.fn(() => null),
  };
});

import HomePage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  listRunsByProjectPaged.mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 5,
    hasMore: false,
  });
  getPilotScorecard.mockResolvedValue(null);
});

describe("HomePage — buyer-polished shell", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("omits co-architect strip, maturity explore cards, and pilot metrics rail", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");

    render(<HomePage />);

    expect(screen.queryByText("ArchLucid — your AI co-architect.")).toBeNull();
    expect(screen.queryByText(/AI co-architect/i)).toBeNull();
    expect(screen.queryByText("Advanced Analysis")).toBeNull();
    expect(screen.queryByText("Explore when ready")).toBeNull();
    expect(screen.queryByText("Operational metrics")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("welcome-banner-mock")).toBeInTheDocument();
    });
  });
});

describe("HomePage (55R smoke — landing)", () => {
  it("renders Reviews panel, maturity layer cards, and workflow panel", async () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Architecture reviews" })).toBeInTheDocument();
    expect(screen.getByText("Advanced Analysis")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Controls")).toBeInTheDocument();
    expect(screen.getByText("Search & Insights")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open sample review package" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.getByTestId("first-run-panel-mock")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("welcome-banner-mock")).toBeInTheDocument();
    });
  });

  it("exposes create-first-request CTA from runs empty state and layer card links", async () => {
    render(<HomePage />);

    const runsLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/reviews?projectId=default");
    expect(runsLinks.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Use this example" })).toBeInTheDocument();
    });
  });

  it("exposes primary workflow destinations matching shell review paths", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open full reviews list" })).toHaveAttribute(
        "href",
        "/reviews?projectId=default",
      );
    });
  });
});
