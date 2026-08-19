import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskVsFrontierAiDifferentiationStrip } from "@/components/ask/AskVsFrontierAiDifferentiationStrip";
import {
  ASK_VS_FRONTIER_AI_COMPACT_LINE,
  ASK_VS_FRONTIER_AI_COMPACT_LINK_LABEL,
  ASK_VS_FRONTIER_AI_TITLE,
  ASK_VS_FRONTIER_AI_ASK_IS_FOR_HEADING,
  ASK_VS_FRONTIER_AI_ASK_WILL_NOT_HEADING,
  ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_HEADING,
} from "@/lib/ask-vs-frontier-ai-differentiation";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";

describe("AskVsFrontierAiDifferentiationStrip (TB-2191)", () => {
  it("renders the full strip with three columns and status tag", () => {
    render(<AskVsFrontierAiDifferentiationStrip />);

    const strip = screen.getByTestId("ask-vs-frontier-ai-strip");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ASK_VS_FRONTIER_AI_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("ask-vs-frontier-ai-status-tag")).toBeInTheDocument();
    expect(screen.getByText(ASK_VS_FRONTIER_AI_ASK_IS_FOR_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ASK_VS_FRONTIER_AI_ASK_WILL_NOT_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_HEADING)).toBeInTheDocument();
  });

  it("renders compact one-liner with link to the Ask hub", () => {
    render(<AskVsFrontierAiDifferentiationStrip variant="compact" />);

    const strip = screen.getByTestId("ask-vs-frontier-ai-strip");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip.textContent ?? "").toContain(ASK_VS_FRONTIER_AI_COMPACT_LINE);

    const link = screen.getByTestId("ask-vs-frontier-ai-compact-link");
    expect(link).toHaveTextContent(ASK_VS_FRONTIER_AI_COMPACT_LINK_LABEL);
    expect(link).toHaveAttribute("href", ASK_REVIEW_QUESTIONS_PATH);
  });
});