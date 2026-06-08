import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

import { WhatIfBranchCompareBanner } from "./WhatIfBranchCompareBanner";

describe("WhatIfBranchCompareBanner", () => {
  it("renders compare link when parentRunId is present in the query string", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("parentRunId=parent-run"));

    render(<WhatIfBranchCompareBanner currentRunId="branch-run" />);

    expect(screen.getByTestId("what-if-branch-compare-banner")).toBeInTheDocument();
    expect(screen.getByTestId("what-if-branch-compare-link")).toHaveAttribute(
      "href",
      "/compare?leftRunId=parent-run&rightRunId=branch-run",
    );
  });

  it("renders nothing without parentRunId", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());

    const { container } = render(<WhatIfBranchCompareBanner currentRunId="branch-run" />);

    expect(container).toBeEmptyDOMElement();
  });
});
