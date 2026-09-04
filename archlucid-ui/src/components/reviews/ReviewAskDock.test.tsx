import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/useAskStream", () => ({
  useAskStream: () => ({
    ask: vi.fn(),
    isStreaming: false,
    tokens: "",
    reset: vi.fn(),
  }),
}));

vi.mock("@/components/ask/AskRunCoverageHonestyStrip", () => ({
  AskRunCoverageHonestyStrip: () => <div data-testid="ask-run-coverage-honesty-strip" />,
}));

import { ReviewAskDock } from "./ReviewAskDock";

describe("ReviewAskDock", () => {
  it("renders an enabled ask dock trigger when the review pipeline is complete", () => {
    render(<ReviewAskDock runId="run-1" reviewTitle="Claims API" />);

    expect(screen.getByTestId("review-ask-dock-trigger")).toBeEnabled();
  });

  it("keeps the ask dock trigger disabled when the review pipeline is incomplete", () => {
    render(
      <ReviewAskDock
        runId="run-1"
        reviewTitle="Claims API"
        disabled
        disabledReason={{
          kind: "lifecycle",
          message: "Unavailable until the review completes. Resolve the execution failure and re-run the review.",
        }}
      />,
    );

    const trigger = screen.getByTestId("review-ask-dock-trigger");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute(
      "aria-label",
      "Unavailable until the review completes. Resolve the execution failure and re-run the review.",
    );

    fireEvent.click(trigger);

    expect(screen.queryByTestId("review-ask-dock-panel")).not.toBeInTheDocument();
  });
});
