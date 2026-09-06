import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal);
});

import { FindingInsightDensityDisclosure } from "./FindingInsightDensityDisclosure";

describe("FindingInsightDensityDisclosure", () => {
  it("renders score and rationale inside disclosure", () => {
    render(
      <FindingInsightDensityDisclosure insightDensityScore={72} whyThisIsNotGeneric="Cites a specific subnet gap." />,
    );

    expect(screen.getByTestId("finding-insight-density-disclosure")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Cites a specific subnet gap.")).toBeInTheDocument();
  });

  it("renders nothing when all fields absent", () => {
    const { container } = render(
      <FindingInsightDensityDisclosure insightDensityScore={null} whyThisIsNotGeneric={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
