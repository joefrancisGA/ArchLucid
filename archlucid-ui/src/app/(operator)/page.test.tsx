import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const listRunsByProjectPaged = vi.fn();
const getPilotScorecard = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

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

vi.mock("@/components/TrialWelcomeRunDeepLink", () => ({
  TrialWelcomeRunDeepLink: () => null,
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: import("react").ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => false,
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
    currentPrincipal: {
      hasCommittedArchitectureReview: false,
    },
  }),
}));

vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator-static-demo")>();

  return {
    ...actual,
    tryStaticDemoRunSummariesPaged: vi.fn(() => null),
  };
});

vi.mock("@/components/cto-demo/CtoDemoResetButton", () => ({
  CtoDemoResetButton: () => (
    <button type="button" data-testid="cto-demo-reset-button-mock">
      Reset demo
    </button>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeAdvancedGuidancePanel", () => ({
  OperatorHomeAdvancedGuidancePanel: () => <div data-testid="operator-home-advanced-guidance" />,
}));

import HomePage from "./page";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
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

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/roi-baseline")) {
        return new Response(JSON.stringify({ complete: true }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/trial-status")) {
        return new Response(JSON.stringify({ status: "None" }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/pilots/runs/recent-deltas")) {
        return new Response(JSON.stringify({ runs: [] }), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }),
  );
});

describe("HomePage — buyer-polished shell", () => {
  useOperatorQueryTestLifecycle();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the home launchpad focused on hero, reviews, and collapsed advanced guidance", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");

    renderWithOperatorQuery(<HomePage />);

    expect(screen.getByTestId("pilot-command-center-card")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-lead").textContent?.toLowerCase()).toContain("design brief");
    expect(screen.queryByTestId("pilot-command-center-outcomes")).toBeNull();
    expect(screen.queryByText("What you'll get")).toBeNull();
    expect(screen.getByTestId("operator-home-example-request-panel")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-sample-review-preview")).toBeInTheDocument();
    const recentReviewsHeading = screen.getByRole("heading", { name: "Recent reviews" });
    expect(recentReviewsHeading).toBeInTheDocument();

    const exampleRequestPanel = screen.getByTestId("operator-home-example-request-panel");
    expect(screen.getByTestId("pilot-command-center-card").compareDocumentPosition(exampleRequestPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exampleRequestPanel.compareDocumentPosition(recentReviewsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("operator-home-advanced-guidance")).toBeInTheDocument();
    });
    expect(screen.queryByText("ROI estimate pending")).toBeNull();
    expect(screen.queryByText("Advanced Analysis")).toBeNull();
    expect(screen.queryByText("Operational metrics")).toBeNull();
    expect(screen.queryByText(/AI co-architect/i)).toBeNull();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open full reviews list" })).toBeInTheDocument();
    });
  });
});

describe("HomePage (55R smoke — landing)", () => {
  useOperatorQueryTestLifecycle();

  it("renders compact hero, reviews panel, and collapsed advanced guidance", async () => {
    renderWithOperatorQuery(<HomePage />);

    expect(screen.getByRole("heading", { name: "Recent reviews" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-example-request-panel")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-sample-review-preview")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-primary")).toHaveAttribute("href", "/reviews/new");
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-try-sample")).toHaveAttribute(
      "href",
      "/reviews/new?zeroConfig=1",
    );
    expect(screen.getByTestId("operator-home-sample-review-open")).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization/findings/phi-minimization-risk",
    );
    expect(screen.getByRole("link", { name: "Open sample finding" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open full example review" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    await waitFor(() => {
      expect(screen.getByTestId("operator-home-advanced-guidance")).toBeInTheDocument();
    });
    expect(screen.queryByText("ROI estimate pending")).toBeNull();
    expect(screen.queryByText("Advanced Analysis")).toBeNull();
  });

  it("exposes create-first-request CTA from runs empty state", async () => {
    renderWithOperatorQuery(<HomePage />);

    const runsLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/reviews?projectId=default");
    expect(runsLinks.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Use this example" })).toBeInTheDocument();
    });
  });

  it("exposes primary workflow destinations matching shell review paths", async () => {
    renderWithOperatorQuery(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open full reviews list" })).toHaveAttribute(
        "href",
        "/reviews?projectId=default",
      );
    });
  });
});
