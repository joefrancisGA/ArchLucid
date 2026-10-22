import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => useSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/hooks/useWhatIfBranchAutoCompare", () => ({
  useWhatIfBranchAutoCompare: () => "idle",
}));

import { WhatIfBranchCompareBanner } from "./WhatIfBranchCompareBanner";

describe("WhatIfBranchCompareBanner", () => {
  it("renders compare link when parentRunId is present in the query string", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("parentRunId=parent-run"));

    render(<WhatIfBranchCompareBanner currentRunId="branch-run" hasCurrentManifest={false} />);

    expect(screen.getByTestId("what-if-branch-compare-banner")).toBeInTheDocument();
    expect(screen.getByTestId("what-if-branch-compare-link")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?priorRunId=parent-run&laterRunId=branch-run",
    );
  });

  it("renders nothing without parentRunId", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());

    const { container } = render(<WhatIfBranchCompareBanner currentRunId="branch-run" />);

    expect(container).toBeEmptyDOMElement();
  });
});
