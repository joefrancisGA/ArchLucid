import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import {
  BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
  FIRST_WEEK_ROUTE_GUIDANCE,
} from "@/lib/first-week-route-guidance";

const buyerPolishedMock = vi.hoisted(() => ({ on: false }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.on,
  };
});

describe("FirstWeekRouteGuidance", () => {
  afterEach(() => {
    buyerPolishedMock.on = false;
  });

  it("renders new-review guidance without redundant wizard CTA", () => {
    render(<FirstWeekRouteGuidance variant="new-review" />);

    expect(screen.getByTestId("first-week-route-guidance-new-review")).toBeInTheDocument();
    expect(screen.getByText(/Use this when:/)).toBeInTheDocument();
    expect(screen.getByText(FIRST_WEEK_ROUTE_GUIDANCE["new-review"].bridgeCopy)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue in wizard below" })).not.toBeInTheDocument();
  });

  it("renders in-progress review detail guidance with header finalize anchor (BDA-001)", () => {
    render(<FirstWeekRouteGuidance variant="review-detail-in-progress" />);

    expect(screen.getByRole("link", { name: "Finalize this review" })).toHaveAttribute(
      "href",
      BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
    );
    expect(screen.getByText(/Skip graph and governance dashboards/i)).toBeInTheDocument();
  });

  it("renders buyer-polished in-progress guidance with header finalize anchor (BDA-001)", () => {
    buyerPolishedMock.on = true;
    render(<FirstWeekRouteGuidance variant="review-detail-in-progress" />);

    expect(screen.getByRole("link", { name: "Finalize this review" })).toHaveAttribute(
      "href",
      BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
    );
  });

  it("renders committed review detail guidance with exports anchor", () => {
    render(<FirstWeekRouteGuidance variant="review-detail-committed" />);

    expect(screen.getByRole("link", { name: "Open exports section" })).toHaveAttribute(
      "href",
      "#artifacts-exports",
    );
  });

  it("renders onboarding guidance with new review route CTA", () => {
    render(<FirstWeekRouteGuidance variant="onboarding" />);

    expect(screen.getByRole("link", { name: "Open new review wizard" })).toHaveAttribute("href", "/reviews/new");
  });

  it("renders home guidance with recommended first-session summary", () => {
    render(<FirstWeekRouteGuidance variant="home" />);

    expect(screen.getByText("Recommended first session path")).toBeInTheDocument();
    expect(screen.queryByText(/Use this when:/)).not.toBeInTheDocument();
    expect(screen.getByText(/evidence-only/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start new review" })).toHaveAttribute("href", "/reviews/new");
  });
});
