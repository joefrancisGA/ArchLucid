import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import {
  FIRST_WEEK_ROUTE_GUIDANCE,
  FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY,
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
    localStorage.clear();
  });

  it("renders new-review guidance without redundant wizard CTA", () => {
    render(<FirstWeekRouteGuidance variant="new-review" />);

    expect(screen.getByTestId("first-week-route-guidance-new-review")).toBeInTheDocument();
    expect(screen.getByTestId("inline-guidance-use-this-when")).toHaveTextContent("Use this when:");
    expect(screen.getByTestId("inline-guidance-use-this-when").tagName).toBe("STRONG");
    expect(screen.getByText(FIRST_WEEK_ROUTE_GUIDANCE["new-review"].bridgeCopy)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue in wizard below" })).not.toBeInTheDocument();
  });

  it("renders in-progress review detail guidance without a competing finalize CTA", () => {
    render(<FirstWeekRouteGuidance variant="review-detail-in-progress" />);

    expect(screen.queryByRole("link", { name: "Finalize this review" })).not.toBeInTheDocument();
    expect(screen.getByText(/Skip graph and approval dashboards/i)).toBeInTheDocument();
  });

  it("renders buyer-polished in-progress guidance without a competing finalize CTA (BDA-001)", () => {
    buyerPolishedMock.on = true;
    render(<FirstWeekRouteGuidance variant="review-detail-in-progress" />);

    expect(screen.queryByRole("link", { name: "Finalize this review" })).not.toBeInTheDocument();
  });

  it("renders committed review detail guidance collapsed without external AI product names", () => {
    render(<FirstWeekRouteGuidance variant="review-detail-committed" />);

    expect(screen.getByTestId("first-week-route-guidance-review-detail-committed")).toBeInTheDocument();
    expect(screen.queryByText(/Use this when:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Claude, GPT, or Gemini/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Expand Review guidance/i }));

    expect(screen.queryByRole("link", { name: "Open exports section" })).not.toBeInTheDocument();
    expect(screen.getByText(/This review is complete/i)).toBeInTheDocument();
  });

  it("renders onboarding guidance with start review CTA and user-facing lead copy", () => {
    render(<FirstWeekRouteGuidance variant="onboarding" />);

    expect(screen.getByText(FIRST_WEEK_ROUTE_GUIDANCE.onboarding.useWhen)).toBeInTheDocument();
    expect(screen.queryByText(/Use this when:/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute("href", ARCHITECTURES_NEW_PATH);
  });

  it("renders home guidance with recommended first-session summary", () => {
    render(<FirstWeekRouteGuidance variant="home" />);

    expect(screen.getByText("Recommended first session path")).toBeInTheDocument();
    expect(screen.getByText(FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY)).toBeInTheDocument();
    expect(screen.queryByText(/Use this when:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/evidence-only/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Expand Recommended first session path/i }));

    expect(screen.getByText(/evidence-only/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute("href", ARCHITECTURES_NEW_PATH);
  });

  it("keeps home collapsed summary free of internal terminology", () => {
    render(<FirstWeekRouteGuidance variant="home" />);

    const collapsedSummary = screen.getByText(FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY);

    expect(collapsedSummary).toBeVisible();
    expect(collapsedSummary.textContent?.toLowerCase()).not.toMatch(/\boperator\b|\brunbook\b|\blane\b|\bshell\b/);
  });

  it("renders home guidance at full section width like peer setup cards", () => {
    render(<FirstWeekRouteGuidance variant="home" />);

    const section = screen.getByTestId("first-week-route-guidance-home");

    expect(section.className).not.toContain("max-w-prose");
    expect(section.className).toContain("rounded-lg");
    expect(section.className).toContain("border");
  });

  it("demotes home guidance primary CTA to outline when another surface owns the page primary", () => {
    render(<FirstWeekRouteGuidance variant="home" pagePrimaryOwnedElsewhere />);

    fireEvent.click(screen.getByRole("button", { name: /Expand Recommended first session path/i }));

    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveClass("border-neutral-300");
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).not.toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );
  });
});
