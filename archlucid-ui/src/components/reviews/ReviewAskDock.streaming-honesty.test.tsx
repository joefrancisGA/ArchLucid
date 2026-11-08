import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/navigation/replace-if-href-changed", () => ({
  commitHrefIfChanged: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("askDock=1"),
  useRouter: () => ({
    replace: vi.fn(),
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
    isStreaming: true,
    tokens: "",
    reset: vi.fn(),
  }),
}));

vi.mock("@/components/ask/AskRunCoverageHonestyStrip", () => ({
  AskRunCoverageHonestyStrip: () => <div data-testid="ask-run-coverage-honesty-strip" />,
}));

import { REVIEW_ASK_STREAMING_ANSWER_PENDING_LABEL } from "@/lib/ask/ask-response-turn-honesty";

import { ReviewAskDock } from "./ReviewAskDock";

describe("ReviewAskDock streaming honesty (P-18)", () => {
  it("shows pending copy when streaming with no answer tokens yet", () => {
    render(<ReviewAskDock runId="run-1" reviewTitle="Claims API" />);

    expect(screen.getByTestId("review-ask-dock-streaming-answer")).toHaveTextContent(
      REVIEW_ASK_STREAMING_ANSWER_PENDING_LABEL,
    );
  });
});
