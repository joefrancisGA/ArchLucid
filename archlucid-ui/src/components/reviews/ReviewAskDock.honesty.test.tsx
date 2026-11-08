import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const askMock = vi.fn();

vi.mock("@/hooks/useAskStream", () => ({
  useAskStream: () => ({
    ask: askMock,
    isStreaming: false,
    tokens: "",
    reset: vi.fn(),
  }),
}));

vi.mock("@/components/ask/AskRunCoverageHonestyStrip", () => ({
  AskRunCoverageHonestyStrip: () => <div data-testid="ask-run-coverage-honesty-strip" />,
}));

import { ReviewAskDock } from "./ReviewAskDock";

describe("ReviewAskDock honesty", () => {
  it("distinguishes missing answers and ask sources from stored-empty values", async () => {
    askMock.mockResolvedValueOnce({
      response: {
        threadId: "thread-1",
        answer: null,
        referencedFindings: null,
        referencedDecisions: null,
        referencedArtifacts: null,
      },
      error: null,
    });

    render(<ReviewAskDock runId="run-1" reviewTitle="Claims API" />);

    expect(screen.getByTestId("review-ask-dock-panel")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "What risks remain open?" },
    });
    fireEvent.click(screen.getByTestId("review-ask-dock-submit"));

    expect(await screen.findByText("Answer was not stored.")).toBeInTheDocument();
    expect(screen.getByTestId("review-ask-dock-sources-not-stored")).toHaveTextContent(
      "Ask sources were not stored on this answer.",
    );

    askMock.mockResolvedValueOnce({
      response: {
        threadId: "thread-1",
        answer: "   ",
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: [],
      },
      error: null,
    });

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "What changed after remediation?" },
    });
    fireEvent.click(screen.getByTestId("review-ask-dock-submit"));

    expect(await screen.findByText("Answer was stored empty.")).toBeInTheDocument();
    expect(screen.getAllByTestId("review-ask-dock-sources-not-stored").at(-1)).toHaveTextContent(
      "Ask sources were stored empty on this answer.",
    );
  });
});
