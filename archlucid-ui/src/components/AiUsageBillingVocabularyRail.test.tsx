import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiUsageBillingVocabularyRail } from "@/components/AiUsageBillingVocabularyRail";
import {
  AI_USAGE_BILLING_AI_USAGE_LINK,
  AI_USAGE_BILLING_BILLING_LINK,
  AI_USAGE_BILLING_COMPACT_LINE,
  AI_USAGE_BILLING_ESTIMATES_HONESTY,
  AI_USAGE_BILLING_HEADING,
  AI_USAGE_BILLING_WHY_TWO,
} from "@/lib/vocabulary/ai-usage-billing-vocabulary";

describe("AiUsageBillingVocabularyRail (TB-2253)", () => {
  it("renders compact strip on AI usage with peer link to billing", () => {
    render(<AiUsageBillingVocabularyRail currentSurfaceId="ai-usage" />);

    const strip = screen.getByTestId("ai-usage-billing-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "ai-usage");
    expect(strip.textContent ?? "").toContain(AI_USAGE_BILLING_COMPACT_LINE);
    expect(screen.getByTestId("ai-usage-billing-vocabulary-honesty")).toHaveTextContent(
      AI_USAGE_BILLING_ESTIMATES_HONESTY,
    );

    const peer = screen.getByTestId("ai-usage-billing-vocabulary-peer-link");
    expect(peer).toHaveTextContent(AI_USAGE_BILLING_BILLING_LINK.label);
    expect(peer).toHaveAttribute("href", AI_USAGE_BILLING_BILLING_LINK.href);
  });

  it("renders compact strip on billing with peer link to AI usage", () => {
    render(<AiUsageBillingVocabularyRail currentSurfaceId="billing" />);

    expect(screen.getByTestId("ai-usage-billing-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "billing",
    );

    const peer = screen.getByTestId("ai-usage-billing-vocabulary-peer-link");
    expect(peer).toHaveTextContent(AI_USAGE_BILLING_AI_USAGE_LINK.label);
    expect(peer).toHaveAttribute("href", AI_USAGE_BILLING_AI_USAGE_LINK.href);
  });

  it("renders full variant with why-two and estimates honesty", () => {
    render(
      <AiUsageBillingVocabularyRail currentSurfaceId="ai-usage" variant="full" />,
    );

    const strip = screen.getByTestId("ai-usage-billing-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(AI_USAGE_BILLING_HEADING)).toBeInTheDocument();
    expect(screen.getByText(AI_USAGE_BILLING_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-billing-vocabulary-honesty")).toHaveTextContent(
      AI_USAGE_BILLING_ESTIMATES_HONESTY,
    );
    expect(screen.getByTestId("ai-usage-billing-vocabulary-current")).toHaveTextContent(
      AI_USAGE_BILLING_AI_USAGE_LINK.label,
    );
  });
});
