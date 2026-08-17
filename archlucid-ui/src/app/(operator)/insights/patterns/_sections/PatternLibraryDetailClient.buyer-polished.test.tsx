import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/patterns/private-endpoints-paas",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PatternLibraryDetailClient } from "./PatternLibraryDetailClient";
import {
  PATTERN_LIBRARY_PRIVACY_NOTE,
  patternLibraryDetailSubtitle,
} from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE, PATTERN_LIBRARY_DETAIL_CLAIM_HEADING } from "@/lib/pattern-library-detail-evidence-copy";

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

describe("PatternLibraryDetailClient buyer-polished shell", () => {
  it("uses buyer subtitle, breadcrumb, refresh, and claim orientation strip", async () => {
    mockInsightCardsFetch([]);

    renderWithQueryClient(<PatternLibraryDetailClient patternKey="private-endpoints-paas" />);

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-detail-provenance-badge")).toHaveTextContent("Sample data");
    });

    expect(
      screen.getByText(patternLibraryDetailSubtitle("ignored", true)),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_PRIVACY_NOTE)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.queryByTestId("pattern-library-policy-packs-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });
});
