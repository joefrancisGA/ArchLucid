import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";

describe("OperatorErrorRecoveryContract (TB-2155)", () => {
  it("renders what failed, intact, and next step markers", () => {
    render(
      <OperatorErrorRecoveryContract presentation={errorRecoveryContractForScenario("connectivity")} />,
    );

    expect(screen.getByTestId("operator-error-recovery-what-failed")).toHaveTextContent("could not reach the API");
    expect(screen.getByTestId("operator-error-recovery-intact")).toHaveTextContent("remain on the server");
    expect(screen.getByTestId("operator-error-recovery-next-step")).toHaveTextContent(/retry/i);
  });
});
