import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import {
  ALERTS_FINDINGS_ALERTS_LINK,
  ALERTS_FINDINGS_COMPACT_LINE,
  ALERTS_FINDINGS_FINDINGS_LINK,
  ALERTS_FINDINGS_HEADING,
  ALERTS_FINDINGS_WHY_TWO,
} from "@/lib/vocabulary/alerts-findings-vocabulary";

describe("AlertsFindingsVocabularyRail (TB-2319)", () => {
  it("renders alerts-inbox strip with peer link to findings queue", () => {
    render(<AlertsFindingsVocabularyRail currentSurfaceId="alerts-inbox" />);

    const strip = screen.getByTestId("alerts-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "alerts-inbox");
    expect(strip.textContent ?? "").toContain(ALERTS_FINDINGS_COMPACT_LINE);

    const peer = screen.getByTestId("alerts-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ALERTS_FINDINGS_FINDINGS_LINK.label);
    expect(peer).toHaveAttribute("href", ALERTS_FINDINGS_FINDINGS_LINK.href);
  });

  it("renders findings-queue strip with peer link to alerts inbox", () => {
    render(<AlertsFindingsVocabularyRail currentSurfaceId="findings-queue" />);

    expect(screen.getByTestId("alerts-findings-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "findings-queue",
    );

    const peer = screen.getByTestId("alerts-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ALERTS_FINDINGS_ALERTS_LINK.label);
    expect(peer).toHaveAttribute("href", ALERTS_FINDINGS_ALERTS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<AlertsFindingsVocabularyRail currentSurfaceId="alerts-inbox" variant="full" />);

    const strip = screen.getByTestId("alerts-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ALERTS_FINDINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ALERTS_FINDINGS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("alerts-findings-vocabulary-current")).toHaveTextContent(
      ALERTS_FINDINGS_ALERTS_LINK.label,
    );
  });
});
