import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicySimulator } from "./PolicySimulator";

describe("PolicySimulator", () => {
  it("renders passed checks in green and failed checks in red sections", () => {
    render(
      <PolicySimulator
        result={{
          passedChecks: ["control.encryption.at-rest"],
          failedChecks: ["control.phi.minimization"],
          gateResult: { blocked: true, warnOnly: false },
          resolvedRunId: "run-001",
        }}
      />,
    );

    expect(screen.getByTestId("policy-simulator-passed-checks")).toHaveTextContent("control.encryption.at-rest");
    expect(screen.getByTestId("policy-simulator-failed-checks")).toHaveTextContent("control.phi.minimization");
    expect(screen.getByText(/would block commit/i)).toBeInTheDocument();
  });
});