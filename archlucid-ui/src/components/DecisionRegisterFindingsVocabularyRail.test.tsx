import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import {
  DECISION_REGISTER_FINDINGS_COMPACT_LINE,
  DECISION_REGISTER_FINDINGS_HEADING,
  DECISION_REGISTER_FINDINGS_QUEUE_LINK,
  DECISION_REGISTER_FINDINGS_REGISTER_LINK,
  DECISION_REGISTER_FINDINGS_WHY_TWO,
} from "@/lib/vocabulary/decision-register-findings-vocabulary";

describe("DecisionRegisterFindingsVocabularyRail (TB-2291)", () => {
  it("renders decision-register strip with peer link to findings queue", () => {
    render(<DecisionRegisterFindingsVocabularyRail currentSurfaceId="decision-register" />);

    const strip = screen.getByTestId("decision-register-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "decision-register");
    expect(strip.textContent ?? "").toContain(DECISION_REGISTER_FINDINGS_COMPACT_LINE);

    const peer = screen.getByTestId("decision-register-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DECISION_REGISTER_FINDINGS_QUEUE_LINK.label);
    expect(peer).toHaveAttribute("href", DECISION_REGISTER_FINDINGS_QUEUE_LINK.href);
  });

  it("renders findings-queue strip with peer link to decision register", () => {
    render(<DecisionRegisterFindingsVocabularyRail currentSurfaceId="findings-queue" />);

    const peer = screen.getByTestId("decision-register-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DECISION_REGISTER_FINDINGS_REGISTER_LINK.label);
    expect(peer).toHaveAttribute("href", DECISION_REGISTER_FINDINGS_REGISTER_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <DecisionRegisterFindingsVocabularyRail
        currentSurfaceId="decision-register"
        variant="full"
      />,
    );

    expect(screen.getByText(DECISION_REGISTER_FINDINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DECISION_REGISTER_FINDINGS_WHY_TWO)).toBeInTheDocument();
  });
});
