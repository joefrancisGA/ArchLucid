import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/buyer-cto-demo-readiness", () => ({
  evaluateBuyerCtoDemoReadiness: vi.fn(async () => ({
    verdict: "ready",
    checks: [],
  })),
}));

import { StartCtoDemoCard } from "@/components/operator-home/StartCtoDemoCard";
import {
  BUYER_HOME_START_CTO_DEMO_ARIA,
  BUYER_HOME_START_CTO_DEMO_CTA,
  BUYER_HOME_START_CTO_DEMO_HEADING,
  BUYER_HOME_START_CTO_DEMO_LEAD,
} from "@/lib/buyer-polish-copy";
import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";

describe("StartCtoDemoCard", () => {
  it("renders heading, lead copy, and CTA linking to golden journey step 1", async () => {
    render(<StartCtoDemoCard />);

    expect(screen.getByRole("region", { name: BUYER_HOME_START_CTO_DEMO_ARIA })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: BUYER_HOME_START_CTO_DEMO_HEADING })).toBeInTheDocument();
    expect(screen.getByText(BUYER_HOME_START_CTO_DEMO_LEAD)).toBeInTheDocument();

    await waitFor(() => {
      const cta = screen.getByTestId("start-cto-demo-cta");
      expect(cta).toHaveAttribute("href", getStartCtoDemoTourHref());
      expect(cta).toHaveTextContent(BUYER_HOME_START_CTO_DEMO_CTA);
    });
  });
});
