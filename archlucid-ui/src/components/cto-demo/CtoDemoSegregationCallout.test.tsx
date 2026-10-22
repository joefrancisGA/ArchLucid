import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/buyer/buyer-cto-demo-tour", () => ({
  readBuyerCtoDemoTourActive: vi.fn(() => true),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: vi.fn(() => true),
};
});

import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { CtoDemoSegregationCallout } from "@/components/cto-demo/CtoDemoSegregationCallout";

describe("CtoDemoSegregationCallout", () => {
  it("renders when the CTO demo tour is active in buyer-polished shell", () => {
    render(<CtoDemoSegregationCallout />);

    expect(screen.getByTestId("cto-demo-segregation-callout")).toBeInTheDocument();
    expect(screen.getByText("Segregation of duties")).toBeInTheDocument();
  });

  it("does not render when the tour is inactive", () => {
    vi.mocked(readBuyerCtoDemoTourActive).mockReturnValueOnce(false);

    render(<CtoDemoSegregationCallout />);

    expect(screen.queryByTestId("cto-demo-segregation-callout")).toBeNull();
  });

  it("does not render outside buyer-polished shell", () => {
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValueOnce(false);

    render(<CtoDemoSegregationCallout />);

    expect(screen.queryByTestId("cto-demo-segregation-callout")).toBeNull();
  });
});
