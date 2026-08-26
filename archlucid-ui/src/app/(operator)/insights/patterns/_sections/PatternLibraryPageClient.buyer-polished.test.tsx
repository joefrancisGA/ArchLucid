import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/patterns",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("runId=run-pattern-test"),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PatternLibraryPageClient } from "./PatternLibraryPageClient";
import {
  PATTERN_LIBRARY_EMPTY_BUILDING_BODY,
  PATTERN_LIBRARY_EMPTY_BUILDING_TITLE,
  PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER,
} from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_CLAIM_HEADING } from "@/lib/pattern-library-evidence-copy";

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

describe("PatternLibraryPageClient buyer-polished shell", () => {
  it("renders breadcrumb, claim strip, and below-threshold empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify([]),
      })) as unknown as typeof fetch,
    );

    renderWithQueryClient(<PatternLibraryPageClient />);

    expect(screen.getByTestId("pattern-library-page-title")).toHaveTextContent("Pattern library");
    expect(screen.getByText(PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-provenance-badge")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-run-scope-banner")).toBeInTheDocument();
      expect(screen.getByTestId("pattern-library-browse-setup-progress")).toBeInTheDocument();
      expect(screen.getByTestId("pattern-library-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByText(PATTERN_LIBRARY_EMPTY_BUILDING_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_EMPTY_BUILDING_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.queryByTestId("pattern-library-policy-packs-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pattern-library-card-grid")).not.toBeInTheDocument();
    expect(screen.queryByText(/runId/i)).not.toBeInTheDocument();
  });

  it("renders unified load failure with retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        text: async () => "Unable to load patterns",
      })) as unknown as typeof fetch,
    );

    renderWithQueryClient(<PatternLibraryPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-load-failure")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pattern-library-load-retry"));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
