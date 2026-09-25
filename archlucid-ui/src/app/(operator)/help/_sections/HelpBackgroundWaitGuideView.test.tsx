import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/help/background-wait",
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () => [
    {
      operationId: "op-1",
      state: "Running",
      title: "Review analysis",
      stepLabel: "Extracting",
      href: "/architecture/reviews/run-1",
      runId: "run-1",
      startedAtMs: Date.now(),
    },
  ],
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpBackgroundWaitGuideView } from "@/app/(operator)/help/_sections/HelpBackgroundWaitGuideView";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_IN_FLIGHT_SHORTCUT_SCOPE,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
} from "@/lib/daytime-wait-help-background-wait-guide-content";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL } from "@/lib/daytime-wait-help-background-wait-return";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";

vi.mock("@/lib/operations/open-shell-in-flight-event", () => ({
  requestOpenShellInFlightOperations: vi.fn(),
}));

describe("HelpBackgroundWaitGuideView (DW-015 / HBA)", () => {
  const entry = getProductDocumentationEntry("background-wait");

  it("renders provenance, anchored sections, cancel clarity, shortcuts, and related topics", () => {
    if (entry === undefined) {
      throw new Error("Expected background-wait documentation entry.");
    }

    render(<HelpBackgroundWaitGuideView entry={entry} />);

    expect(screen.getByTestId("help-background-wait-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-background-wait-page-title")).toHaveTextContent(
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    for (const adrLink of screen.getAllByRole("link", { name: "ADR 0096" })) {
      expect(adrLink).toHaveAttribute("href", DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF);
    }
    expect(screen.getByTestId("help-background-wait-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-background-wait-overview").textContent?.toLowerCase()).not.toMatch(
      /stay on this page/i,
    );
    expect(screen.queryByTestId("help-background-wait-desk-helper")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-background-wait-honesty-panel")).not.toBeInTheDocument();

    for (const heading of DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    const cancelSection = screen.getByTestId("help-background-wait-cancel-clarity");

    for (const action of DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY.actions) {
      expect(within(cancelSection).getByText(action.helpExplanation)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: action.label })).toHaveAttribute(
        "id",
        `background-wait-${action.id}`,
      );
    }

    expect(screen.getByTestId("help-background-wait-stop-safety").textContent).toMatch(/CancelRequested/i);
    expect(screen.getByTestId("help-background-wait-no-percentage").textContent).toMatch(/percentComplete/);
    expect(screen.getByTestId("help-background-wait-completion-check-back").textContent).not.toMatch(
      /we will email you/i,
    );
    expect(screen.getByTestId("help-background-wait-seat-working").textContent).toMatch(/Record execute/i);
    expect(screen.getByTestId("help-background-wait-seat-working").textContent).not.toMatch(/Career Real/i);

    const stateList = screen.getByTestId("help-background-wait-operation-states");
    expect(within(stateList).getAllByText("In progress").length).toBeGreaterThan(0);
    expect(within(stateList).getByText("Pending")).toBeInTheDocument();

    expect(screen.getByTestId("help-background-wait-in-flight-strip-action")).toHaveTextContent("1 in progress");
    expect(screen.getByTestId("help-background-wait-open-in-flight-strip")).toHaveAttribute(
      "aria-keyshortcuts",
      "alt+shift+i",
    );

    expect(screen.getByTestId("help-background-wait-resume-shortcut-chip")).toHaveTextContent(
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_IN_FLIGHT_SHORTCUT_SCOPE,
    );
    expect(screen.getByTestId("help-background-wait-keyboard-shortcut-chip")).toHaveAttribute(
      "aria-keyshortcuts",
      "alt+shift+i",
    );

    expect(screen.getByTestId("help-background-wait-open-shortcuts-link")).toHaveAttribute(
      "href",
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF,
    );

    const related = screen.getByTestId("help-background-wait-related-topics");

    for (const topic of DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-background-wait-return-to-help")).toHaveAttribute(
      "href",
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN.href,
    );
  });

  it("renders Back to review when returnTo targets a review route", () => {
    if (entry === undefined) {
      throw new Error("Expected background-wait documentation entry.");
    }

    mockSearchParams.set("returnTo", "/architecture/reviews/run-42?tab=activity");
    render(<HelpBackgroundWaitGuideView entry={entry} />);

    expect(screen.getByTestId("help-background-wait-return-to-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-42?tab=activity",
    );
    expect(screen.getByTestId("help-background-wait-return-to-review")).toHaveTextContent(
      DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL,
    );

    mockSearchParams.delete("returnTo");
  });

  it("ignores invalid returnTo values", () => {
    if (entry === undefined) {
      throw new Error("Expected background-wait documentation entry.");
    }

    mockSearchParams.set("returnTo", "https://evil.example/reviews/run-1");
    render(<HelpBackgroundWaitGuideView entry={entry} />);

    expect(screen.queryByTestId("help-background-wait-return-to-review")).not.toBeInTheDocument();

    mockSearchParams.delete("returnTo");
  });

  it("opens the shell in-flight strip from the live action button", () => {
    if (entry === undefined) {
      throw new Error("Expected background-wait documentation entry.");
    }

    render(<HelpBackgroundWaitGuideView entry={entry} />);

    screen.getByTestId("help-background-wait-open-in-flight-strip").click();

    expect(requestOpenShellInFlightOperations).toHaveBeenCalled();
  });
});
