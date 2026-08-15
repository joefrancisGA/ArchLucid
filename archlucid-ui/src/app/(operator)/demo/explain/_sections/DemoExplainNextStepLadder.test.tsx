import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DemoExplainNextStepLadder } from "@/app/(operator)/demo/explain/_sections/DemoExplainNextStepLadder";
import {
  DEMO_EXPLAIN_LADDER_GET_STARTED_HREF,
  DEMO_EXPLAIN_LADDER_HELP_HREF,
  DEMO_EXPLAIN_LADDER_LIVE_DEMO_HREF,
  DEMO_EXPLAIN_LADDER_PRIMARY_HREF,
  DEMO_EXPLAIN_LADDER_WELCOME_HREF,
  DEMO_EXPLAIN_RETRY_LABEL,
} from "@/lib/demo-explain-page-copy";

describe("DemoExplainNextStepLadder (TB-1321)", () => {
  it("renders primary see-it CTA and secondary proof links", () => {
    render(<DemoExplainNextStepLadder />);

    expect(screen.getByTestId("demo-explain-ladder-primary")).toHaveAttribute("href", DEMO_EXPLAIN_LADDER_PRIMARY_HREF);
    expect(screen.getByRole("link", { name: /Prefer a longer walkthrough/i })).toHaveAttribute(
      "href",
      DEMO_EXPLAIN_LADDER_LIVE_DEMO_HREF,
    );
    expect(screen.getByRole("link", { name: /Back to ArchLucid/i })).toHaveAttribute("href", DEMO_EXPLAIN_LADDER_WELCOME_HREF);
    expect(screen.getByRole("link", { name: /Getting started/i })).toHaveAttribute(
      "href",
      DEMO_EXPLAIN_LADDER_GET_STARTED_HREF,
    );
    expect(screen.getByRole("link", { name: /Evidence trail help/i })).toHaveAttribute("href", DEMO_EXPLAIN_LADDER_HELP_HREF);
  });

  it("renders retry when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(<DemoExplainNextStepLadder onRetry={onRetry} />);

    const retry = screen.getByTestId("demo-explain-retry");
    expect(retry).toHaveTextContent(DEMO_EXPLAIN_RETRY_LABEL);
    retry.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
