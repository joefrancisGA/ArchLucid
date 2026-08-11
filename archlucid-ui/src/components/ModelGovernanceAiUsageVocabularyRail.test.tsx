import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import {
  MODEL_GOVERNANCE_AI_USAGE_COMPACT_LINE,
  MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK,
  MODEL_GOVERNANCE_AI_USAGE_HEADING,
  MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK,
  MODEL_GOVERNANCE_AI_USAGE_WHY_TWO,
} from "@/lib/model-governance-ai-usage-vocabulary";

describe("ModelGovernanceAiUsageVocabularyRail (TB-2286)", () => {
  it("renders compact strip on model governance with peer link to AI usage", () => {
    render(<ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" />);

    const strip = screen.getByTestId("model-governance-ai-usage-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "model-governance");
    expect(strip.textContent ?? "").toContain(MODEL_GOVERNANCE_AI_USAGE_COMPACT_LINE);

    const peer = screen.getByTestId("model-governance-ai-usage-vocabulary-peer-link");
    expect(peer).toHaveTextContent(MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK.label);
    expect(peer).toHaveAttribute("href", MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK.href);
  });

  it("renders compact strip on AI usage with peer link to model governance", () => {
    render(<ModelGovernanceAiUsageVocabularyRail currentSurfaceId="ai-usage" />);

    expect(screen.getByTestId("model-governance-ai-usage-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "ai-usage",
    );

    const peer = screen.getByTestId("model-governance-ai-usage-vocabulary-peer-link");
    expect(peer).toHaveTextContent(MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK.label);
    expect(peer).toHaveAttribute("href", MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK.href);
  });

  it("renders full variant with why-two", () => {
    render(
      <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="model-governance" variant="full" />,
    );

    const strip = screen.getByTestId("model-governance-ai-usage-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(MODEL_GOVERNANCE_AI_USAGE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(MODEL_GOVERNANCE_AI_USAGE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("model-governance-ai-usage-vocabulary-current")).toHaveTextContent(
      MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK.label,
    );
  });
});
