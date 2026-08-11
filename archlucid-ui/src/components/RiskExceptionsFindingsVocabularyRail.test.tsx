import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import {
  RISK_EXCEPTIONS_FINDINGS_COMPACT_LINE,
  RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK,
  RISK_EXCEPTIONS_FINDINGS_HEADING,
  RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK,
  RISK_EXCEPTIONS_FINDINGS_WHY_TWO,
} from "@/lib/risk-exceptions-findings-vocabulary";

describe("RiskExceptionsFindingsVocabularyRail (TB-2249)", () => {
  it("renders compact strip on risk exceptions with peer link to findings", () => {
    render(
      <RiskExceptionsFindingsVocabularyRail currentSurfaceId="risk-exceptions" />,
    );

    const strip = screen.getByTestId("risk-exceptions-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "risk-exceptions");
    expect(strip.textContent ?? "").toContain(RISK_EXCEPTIONS_FINDINGS_COMPACT_LINE);

    const peer = screen.getByTestId("risk-exceptions-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK.label);
    expect(peer).toHaveAttribute("href", RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK.href);
  });

  it("renders compact strip on findings queue with peer link to risk exceptions", () => {
    render(
      <RiskExceptionsFindingsVocabularyRail currentSurfaceId="findings-queue" />,
    );

    expect(screen.getByTestId("risk-exceptions-findings-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "findings-queue",
    );

    const peer = screen.getByTestId("risk-exceptions-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK.label);
    expect(peer).toHaveAttribute("href", RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <RiskExceptionsFindingsVocabularyRail
        currentSurfaceId="risk-exceptions"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("risk-exceptions-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(RISK_EXCEPTIONS_FINDINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(RISK_EXCEPTIONS_FINDINGS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("risk-exceptions-findings-vocabulary-current")).toHaveTextContent(
      RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK.label,
    );
  });
});
