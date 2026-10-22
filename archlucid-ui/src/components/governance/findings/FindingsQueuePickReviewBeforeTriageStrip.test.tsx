import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/governance/findings",
  });
});

import {
  FindingsQueuePickReviewBeforeTriageStrip,
  FindingsQueueScopeDisclosure,
} from "./FindingsQueuePickReviewBeforeTriageStrip";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string; label: string }) => (
    <div data-testid="ask-run-id-picker" data-label={props.label}>
      {props.value}
    </div>
  ),
}));

describe("FindingsQueuePickReviewBeforeTriageStrip", () => {
  it("renders optional review picker with review label", () => {
    render(
      <FindingsQueuePickReviewBeforeTriageStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("ask-run-id-picker")).toHaveAttribute("data-label", "Review");
  });
});

describe("FindingsQueueScopeDisclosure", () => {
  it("renders collapsed optional scope control", () => {
    render(
      <FindingsQueueScopeDisclosure selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("findings-queue-scope-disclosure")).toBeInTheDocument();
    expect(screen.getByText("Filter to one review")).toBeInTheDocument();
  });
});
