import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClarificationsFindingsVocabularyRail } from "@/components/ClarificationsFindingsVocabularyRail";
import {
  CLARIFICATIONS_FINDINGS_COMPACT_LINE,
  CLARIFICATIONS_FINDINGS_HEADING,
  CLARIFICATIONS_FINDINGS_WHY_TWO,
  buildClarificationsFindingsVocabulary,
} from "@/lib/vocabulary/clarifications-findings-vocabulary";

describe("ClarificationsFindingsVocabularyRail (TB-2298)", () => {
  it("renders clarifications strip with findings peer link", () => {
    const model = buildClarificationsFindingsVocabulary("run-abc");

    render(
      <ClarificationsFindingsVocabularyRail
        runId="run-abc"
        currentSurfaceId="clarifications"
      />,
    );

    const strip = screen.getByTestId("clarifications-findings-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "clarifications");
    expect(strip.textContent ?? "").toContain(CLARIFICATIONS_FINDINGS_COMPACT_LINE);

    const peer = screen.getByTestId("clarifications-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(model.findingsLink.label);
    expect(peer).toHaveAttribute("href", model.findingsLink.href);
  });

  it("renders findings strip with clarifications peer link", () => {
    const model = buildClarificationsFindingsVocabulary("run-abc");

    render(
      <ClarificationsFindingsVocabularyRail runId="run-abc" currentSurfaceId="findings" />,
    );

    const peer = screen.getByTestId("clarifications-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(model.clarificationsLink.label);
    expect(peer).toHaveAttribute("href", model.clarificationsLink.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ClarificationsFindingsVocabularyRail
        runId="run-abc"
        currentSurfaceId="clarifications"
        variant="full"
      />,
    );

    expect(screen.getByText(CLARIFICATIONS_FINDINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(CLARIFICATIONS_FINDINGS_WHY_TWO)).toBeInTheDocument();
  });
});
