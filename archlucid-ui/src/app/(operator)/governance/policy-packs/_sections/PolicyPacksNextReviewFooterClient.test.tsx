import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPacksNextReviewFooterClient } from "./PolicyPacksNextReviewFooterClient";

const productLine = vi.hoisted(() => ({ value: "security" as const }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLine.value }),
}));

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: vi.fn(async () => ({})),
}));

vi.mock("@/lib/buyer/buyer-facing-review-title", () => ({
  buyerFacingReviewTitleFromSummary: () => "Next review",
}));

vi.mock("@/lib/operator/operator-response-guards", () => ({
  coerceRunSummaryPaged: () => ({
    ok: true,
    value: { items: [{ runId: "next-run" }] },
  }),
}));

vi.mock("@/lib/operator/operator-runs-list-with-demo-fallback", () => ({
  enrichRunsListWithStaticDemoFallback: (runs: readonly { runId: string }[]) => runs,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => ({}),
}));

vi.mock("@/lib/operator/operator-resource-scope", () => ({
  projectIdFromScopeHeaders: () => "default",
}));

vi.mock("@/lib/resolve-next-runs-list-row", () => ({
  resolveNextRunsListRow: () => ({
    runId: "next-run",
    reviewTitle: "Next review",
    href: "/architecture/reviews/next-run",
  }),
}));

describe("PolicyPacksNextReviewFooterClient", () => {
  it("keeps the next-review action inside the SecureNow policy packs hub", async () => {
    render(<PolicyPacksNextReviewFooterClient runId="current-run" />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-packs-next-review-action")).toHaveAttribute(
        "href",
        "/compliance/policy-packs?reviewId=next-run",
      );
    });
  });
});
