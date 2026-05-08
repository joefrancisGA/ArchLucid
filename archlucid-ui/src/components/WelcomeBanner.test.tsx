import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

const listRunsByProjectPaged = vi.fn();
const loadProjectRunsMergedWithDemoFallbackMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: (...args: unknown[]) => listRunsByProjectPaged(...args),
}));

vi.mock("@/lib/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: (...args: unknown[]) =>
    loadProjectRunsMergedWithDemoFallbackMock(...args),
}));

import { OperatorCoArchitectHomeStrip } from "./OperatorCoArchitectHomeStrip";
import { WelcomeBanner } from "./WelcomeBanner";

const SESSION_DISMISS_KEY = "archlucid_welcome_dismissed_session";

function renderHomeWithCoArchitectStrip() {
  render(
    <>
      <OperatorCoArchitectHomeStrip />
      <WelcomeBanner />
    </>,
  );
}

const emptyRunsPage = {
  items: [] as RunSummary[],
  totalCount: 0,
  page: 1,
  pageSize: 1,
  hasMore: false,
};

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

beforeEach(() => {
  listRunsByProjectPaged.mockResolvedValue(emptyRunsPage);
  loadProjectRunsMergedWithDemoFallbackMock.mockResolvedValue({ items: [], loadError: false });
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("/api/proxy/v1/tenant/trial-status")) {
      return new Response(JSON.stringify({ status: "Inactive" }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
});

describe("WelcomeBanner — renders heading and CTAs", () => {
  it("shows welcome heading, co-architect strip CTAs, value card, and example link when not dismissed", async () => {
    renderHomeWithCoArchitectStrip();

    await waitFor(() => {
      expect(screen.getByRole("banner", { name: "Welcome" })).toBeInTheDocument();
    });

    const banner = screen.getByRole("banner", { name: "Welcome" });

    expect(
      within(banner).getByRole("heading", {
        name: "Your first architecture review — four steps",
      }),
    ).toBeInTheDocument();

    expect(
      within(banner).getByText((_, node) => {
        const el = node instanceof HTMLElement ? node : null;
        const text = el?.textContent ?? "";

        return (
          el?.tagName === "P" &&
          text.toLowerCase().includes("finalize") &&
          text.toLowerCase().includes("review package") &&
          text.toLowerCase().includes("pipeline") &&
          !text.toLowerCase().includes("manifest")
        );
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start architecture review" })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: "Describe what you want" })).toHaveAttribute("href", "/reviews/new?intent=describe");
    expect(screen.getByText("Governed manifest")).toBeInTheDocument();
    expect(screen.getByText(/one request produces everything needed for review/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/What one completed architecture review delivers/i)).toBeInTheDocument();
    const exampleLinks = screen.getAllByRole("link", { name: /see completed example/i });
    expect(exampleLinks.length).toBeGreaterThanOrEqual(1);
    expect(exampleLinks[0]).toHaveAttribute("href", "/showcase/claims-intake-modernization");
    expect(screen.getByTestId("opt-in-tour-launcher")).toBeInTheDocument();
  });

  it("shows returning-user copy when at least one run exists", async () => {
    const run: RunSummary = {
      runId: "00000000-0000-0000-0000-000000000099",
      projectId: "default",
      description: "Demo",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: false,
      hasGoldenManifest: false,
    };
    listRunsByProjectPaged.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 1,
      hasMore: false,
    });
    loadProjectRunsMergedWithDemoFallbackMock.mockResolvedValue({ items: [run], loadError: false });

    renderHomeWithCoArchitectStrip();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Your review workspace" })).toBeInTheDocument();
    });

    expect(within(screen.getByRole("banner", { name: "Welcome" })).getByText(/Open in-progress architecture reviews/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start architecture review" })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: /see completed example/i })).toHaveAttribute(
      "href",
      "/showcase/claims-intake-modernization",
    );
  });
});

describe("WelcomeBanner — dismiss hides banner", () => {
  it("hides after session dismiss click", async () => {
    renderHomeWithCoArchitectStrip();

    await waitFor(() => {
      expect(screen.getByRole("banner", { name: "Welcome" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /dismiss welcome/i }));

    expect(screen.queryByRole("banner", { name: "Welcome" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_DISMISS_KEY)).toBe("1");
  });
});

describe("WelcomeBanner — session flag respected on re-render", () => {
  it("stays hidden when session dismissed flag is set", async () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    render(<WelcomeBanner />);

    await waitFor(() => {
      expect(screen.queryByRole("banner", { name: "Welcome" })).not.toBeInTheDocument();
    });
  });
});
