import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push }),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/buyer/buyer-cto-demo-readiness", () => ({
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
} from "@/lib/buyer/buyer-polish-copy";
import { getStartCtoDemoTourHref } from "@/lib/buyer/buyer-cto-demo-tour";

describe("StartCtoDemoCard", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders heading, lead copy, and starts the demo after optimistic preflight", async () => {
    render(<StartCtoDemoCard />);

    expect(screen.getByRole("region", { name: BUYER_HOME_START_CTO_DEMO_ARIA })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: BUYER_HOME_START_CTO_DEMO_HEADING })).toBeInTheDocument();
    expect(screen.getByText(BUYER_HOME_START_CTO_DEMO_LEAD)).toBeInTheDocument();

    const cta = screen.getByTestId("start-cto-demo-cta");
    expect(cta).toHaveTextContent(BUYER_HOME_START_CTO_DEMO_CTA);

    fireEvent.click(cta);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(getStartCtoDemoTourHref());
    });
  });
});
