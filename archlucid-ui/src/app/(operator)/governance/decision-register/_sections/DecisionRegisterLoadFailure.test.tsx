import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DecisionRegisterLoadFailure } from "./DecisionRegisterLoadFailure";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "governance" as const }),
}));

vi.mock("@/components/support/FatalPageReportProblemAction", () => ({
  FatalPageReportProblemSupportRow: () => <div data-testid="decision-register-report-problem-stub" />,
}));

describe("DecisionRegisterLoadFailure", () => {
  it("mounts load failure and report problem contract", () => {
    render(<DecisionRegisterLoadFailure message="Register could not load." onRetry={() => undefined} />);

    expect(screen.getByTestId("decision-register-load-failure")).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-report-problem-stub")).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-load-retry")).toBeInTheDocument();
  });
});