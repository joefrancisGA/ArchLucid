import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { PatternLibraryDetailClient } from "./PatternLibraryDetailClient";
import {
  PATTERN_LIBRARY_AGGREGATE_PRIVACY_COPY,
  PATTERN_LIBRARY_SAMPLE_NOTICE,
} from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_POLICY_RULES_GUIDANCE_LEAD } from "@/lib/pattern-library-policy-guidance-copy";

function renderWithQueryClient(ui: React.ReactElement): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function mockInsightCardsFetch(cards: unknown[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(cards),
    })) as unknown as typeof fetch,
  );
}

describe("PatternLibraryDetailClient (TB-1811 / TB-1812 / TB-1813 / TB-1815)", () => {
  it("shows sample provenance notice on detail when live aggregate threshold is not met", async () => {
    mockInsightCardsFetch([]);

    renderWithQueryClient(<PatternLibraryDetailClient patternKey="private-endpoints-paas" />);

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-detail-provenance-badge")).toHaveTextContent("Internal test data");
    });

    expect(screen.getByText(PATTERN_LIBRARY_SAMPLE_NOTICE)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(PATTERN_LIBRARY_POLICY_RULES_GUIDANCE_LEAD)).toBeInTheDocument();
    });

    expect(screen.queryByRole("link", { name: /private link required/i })).not.toBeInTheDocument();
  });

  it("shows anonymized aggregate provenance on detail when live aggregate threshold is met", async () => {
    mockInsightCardsFetch([
      { patternKey: "a", industryVertical: "General", summary: "A", contributingTenantCount: 5 },
      { patternKey: "b", industryVertical: "General", summary: "B", contributingTenantCount: 6 },
      { patternKey: "c", industryVertical: "General", summary: "C", contributingTenantCount: 7 },
    ]);

    renderWithQueryClient(<PatternLibraryDetailClient patternKey="private-endpoints-paas" />);

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-detail-provenance-badge")).toHaveTextContent("Anonymized aggregate");
    });

    expect(screen.getByText(PATTERN_LIBRARY_AGGREGATE_PRIVACY_COPY)).toBeInTheDocument();
  });

  it("links contextual peer compare instead of hard-coded api-gateway-bff (TB-1812)", async () => {
    mockInsightCardsFetch([]);

    renderWithQueryClient(<PatternLibraryDetailClient patternKey="api-gateway-bff" />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Compare with Three-tier app modernization/i })).toBeInTheDocument();
    });

    const peerLink = screen.getByRole("link", { name: /Compare with Three-tier app modernization/i });

    expect(peerLink).toHaveAttribute("href", "/insights/patterns/three-tier-app-modernization");
    expect(screen.queryByRole("link", { name: /^Compare peer pattern$/i })).not.toBeInTheDocument();
  });

  it("keeps one primary Use in review action in the header (TB-1815)", async () => {
    mockInsightCardsFetch([]);

    renderWithQueryClient(<PatternLibraryDetailClient patternKey="private-endpoints-paas" />);

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-detail-primary-use-in-review")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pattern-library-detail-primary-cta-cluster")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-primary-use-in-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?pattern=private-endpoints-paas",
    );

    const footerUseLink = screen.getByTestId("pattern-library-detail-secondary-use-in-review");

    expect(footerUseLink.className).toContain("border-neutral-300");
    expect(footerUseLink.className).not.toContain("bg-[var(--al-primary-action-bg)]");
    expect(screen.getByTestId("pattern-library-detail-next-steps")).toBeInTheDocument();
  });
});
