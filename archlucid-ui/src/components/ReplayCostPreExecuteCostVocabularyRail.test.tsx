import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReplayCostPreExecuteCostVocabularyRail } from "@/components/ReplayCostPreExecuteCostVocabularyRail";
import {
  REPLAY_COST_PRE_EXECUTE_COST_COMPACT_LINE,
  REPLAY_COST_PRE_EXECUTE_COST_ESTIMATES_HONESTY,
  REPLAY_COST_PRE_EXECUTE_COST_HEADING,
  REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK,
  REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK,
  REPLAY_COST_PRE_EXECUTE_COST_WHY_TWO,
} from "@/lib/replay-cost-pre-execute-cost-vocabulary";

describe("ReplayCostPreExecuteCostVocabularyRail (TB-2284)", () => {
  it("renders compact strip on replay cost with peer link to pre-execute", () => {
    render(<ReplayCostPreExecuteCostVocabularyRail currentSurfaceId="replay-cost" />);

    const strip = screen.getByTestId("replay-cost-pre-execute-cost-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "replay-cost");
    expect(strip.textContent ?? "").toContain(REPLAY_COST_PRE_EXECUTE_COST_COMPACT_LINE);

    const peer = screen.getByTestId("replay-cost-pre-execute-cost-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK.label);
    expect(peer).toHaveAttribute("href", REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK.href);
  });

  it("renders compact strip on pre-execute with peer link to replay cost", () => {
    render(<ReplayCostPreExecuteCostVocabularyRail currentSurfaceId="pre-execute-cost" />);

    expect(screen.getByTestId("replay-cost-pre-execute-cost-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "pre-execute-cost",
    );

    const peer = screen.getByTestId("replay-cost-pre-execute-cost-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK.label);
    expect(peer).toHaveAttribute("href", REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK.href);
  });

  it("renders full variant with why-two and estimates honesty", () => {
    render(
      <ReplayCostPreExecuteCostVocabularyRail currentSurfaceId="replay-cost" variant="full" />,
    );

    const strip = screen.getByTestId("replay-cost-pre-execute-cost-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(REPLAY_COST_PRE_EXECUTE_COST_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REPLAY_COST_PRE_EXECUTE_COST_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("replay-cost-pre-execute-cost-vocabulary-honesty"),
    ).toHaveTextContent(REPLAY_COST_PRE_EXECUTE_COST_ESTIMATES_HONESTY);
    expect(
      screen.getByTestId("replay-cost-pre-execute-cost-vocabulary-current"),
    ).toHaveTextContent(REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK.label);
  });
});
