import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RiskExceptionsTriageFirstExpiringStrip } from "./RiskExceptionsTriageFirstExpiringStrip";

describe("RiskExceptionsTriageFirstExpiringStrip", () => {
  it("calls extend for the target waiver", () => {
    const onExtend = vi.fn();

    render(
      <RiskExceptionsTriageFirstExpiringStrip
        target={{
          riskExceptionId: "exc-1",
          findingId: "finding-phi",
          expiresAtUtc: "2026-09-01T00:00:00.000Z",
          rationale: "Temporary waiver",
        }}
        onExtend={onExtend}
      />,
    );

    screen.getByTestId("risk-exceptions-triage-first-expiring-extend").click();
    expect(onExtend).toHaveBeenCalledWith("exc-1");
  });
});
