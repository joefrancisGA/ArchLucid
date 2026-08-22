import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  OPEN_FULL_HELP_PAGE_LABEL,
  PageScopedContextualHelpPanel,
  pageHelpDrawerSectionDomId,
} from "@/components/usability/PageScopedContextualHelpPanel";
import type { PageContextualHelpEntry } from "@/lib/contextual-help-registry";

const FULL_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage: "Short page summary.",
  whatToDoNext: "Do the next thing.",
  whyEmpty: "Empty because nothing happened yet.",
  whereToConfigurePrerequisite: "Configure prerequisites in settings UI.",
  whatToDoNextAction: {
    label: "Open Schedule tab",
    href: "/architecture/digests?tab=schedule",
  },
  whereToConfigureAction: {
    label: "Open Schedule tab",
    href: "/architecture/digests?tab=schedule",
  },
  taskSteps: ["Complete the first step.", "Then finish the second step."],
};

const MINIMAL_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage: "Only required fields.",
  whatToDoNext: "Next step only.",
};

function pressTrigger(): HTMLElement {
  const trigger = screen.getByTestId("page-contextual-help-button");

  expect(trigger.className).not.toMatch(/\bborder(?:\s|-neutral|-transparent)/);

  act(() => {
    fireEvent.click(trigger);
  });

  return trigger;
}

describe("PageScopedContextualHelpPanel", () => {
  it("renders available fields, task steps, and the full-help link in a right drawer", async () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    pressTrigger();

    const panel = await screen.findByTestId("page-scoped-contextual-help-panel");

    expect(panel.className).toMatch(/inset-y-0/);
    expect(panel.className).toMatch(/right-0/);
    expect(panel).toHaveAttribute("aria-modal", "false");
    expect(screen.getByText("Short page summary.")).toBeInTheDocument();
    expect(screen.getByText("Do the next thing.")).toBeInTheDocument();
    expect(screen.getByText("Empty because nothing happened yet.")).toBeInTheDocument();
    expect(screen.getByText("Configure prerequisites in settings UI.")).toBeInTheDocument();
    expect(screen.getByText("Complete the first step.")).toBeInTheDocument();
    expect(screen.getByText("Then finish the second step.")).toBeInTheDocument();

    const nextAction = screen.getByTestId("page-scoped-contextual-help-next-action");

    expect(nextAction).toHaveAttribute("href", "/architecture/digests?tab=schedule");

    const configureAction = screen.getByTestId("page-scoped-contextual-help-configure-action");

    expect(configureAction).toHaveAttribute("href", "/architecture/digests?tab=schedule");

    const learnMore = screen.getByTestId("page-scoped-contextual-help-learn-more");

    expect(learnMore).toHaveAttribute("href", "/help/review-packages");
    expect(learnMore).toHaveTextContent(OPEN_FULL_HELP_PAGE_LABEL);
  });

  it("keeps field headings medium and primary after helper token merge", async () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    pressTrigger();

    const heading = await screen.findByText("What is this page?");

    expect(heading).toHaveClass("font-medium", "text-al-text-primary");
    expect(heading).not.toHaveClass("font-normal");
    expect(heading).not.toHaveClass("text-al-text-secondary");
  });

  it("omits optional fields and learn more when absent", async () => {
    render(
      <PageScopedContextualHelpPanel entry={MINIMAL_ENTRY} triggerLabel="Fallback" learnMoreHref={null} />,
    );

    pressTrigger();

    await screen.findByTestId("page-scoped-contextual-help-panel");

    expect(screen.queryByText("Why is this empty?")).not.toBeInTheDocument();
    expect(screen.queryByText("Where to configure")).not.toBeInTheDocument();
    expect(screen.queryByText("How to do this")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-scoped-contextual-help-learn-more")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-scoped-contextual-help-next-action")).not.toBeInTheDocument();
  });

  it("shows a generic fallback when the page has no Category-1 answers", async () => {
    render(
      <PageScopedContextualHelpPanel
        entry={null}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    pressTrigger();

    await screen.findByTestId("page-scoped-contextual-help-panel");

    expect(screen.getByText("Open the full help page for guidance on this screen.")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/review-packages",
    );
  });

  it("keeps the full topic in the accessible name when short trigger text is set", () => {
    render(
      <PageScopedContextualHelpPanel
        entry={MINIMAL_ENTRY}
        triggerLabel="Reviews"
        triggerText="Help"
        learnMoreHref={null}
      />,
    );

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger).toHaveAttribute("aria-label", "Help: Reviews");
    expect(trigger).toHaveTextContent("Help");
  });

  it("exposes the panel as a dialog wired to the trigger", async () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    pressTrigger();

    const panel = await screen.findByRole("dialog", { name: "Reviews" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveAttribute("aria-label", "Help: Reviews");
    expect(panel).toBeInTheDocument();
  });

  it("does not open on hover, because the panel carries focusable deep links", () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    const trigger = screen.getByTestId("page-contextual-help-button");

    act(() => {
      fireEvent.pointerOver(trigger);
      fireEvent.pointerEnter(trigger);
      fireEvent.mouseOver(trigger);
    });

    expect(screen.queryByTestId("page-scoped-contextual-help-panel")).not.toBeInTheDocument();
  });

  it("moves focus into the panel on open so deep-link CTAs are keyboard reachable", async () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    pressTrigger();

    const panel = await screen.findByTestId("page-scoped-contextual-help-panel");

    await waitFor(() => {
      expect(panel === document.activeElement || panel.contains(document.activeElement)).toBe(true);
    });
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    const trigger = pressTrigger();

    await screen.findByTestId("page-scoped-contextual-help-panel");

    act(() => {
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("page-scoped-contextual-help-panel")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("does not reset sibling form state when opened or closed", async () => {
    render(
      <form>
        <label htmlFor="draft-name">Draft name</label>
        <input id="draft-name" defaultValue="Keep me" />
        <PageScopedContextualHelpPanel
          entry={MINIMAL_ENTRY}
          triggerLabel="Reviews"
          learnMoreHref="/help/review-packages"
        />
      </form>,
    );

    const input = screen.getByLabelText("Draft name");

    fireEvent.change(input, { target: { value: "Unsaved brief" } });
    pressTrigger();

    await screen.findByTestId("page-scoped-contextual-help-panel");

    expect(input).toHaveValue("Unsaved brief");

    act(() => {
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("page-scoped-contextual-help-panel")).not.toBeInTheDocument();
    });

    expect(input).toHaveValue("Unsaved brief");
  });

  it("scrolls the requested section into view when the drawer opens", async () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      render(
        <PageScopedContextualHelpPanel
          entry={FULL_ENTRY}
          triggerLabel="Reviews"
          learnMoreHref="/help/review-packages"
          sectionId="what-to-do-next"
        />,
      );

      pressTrigger();

      await screen.findByTestId("page-scoped-contextual-help-panel");

      expect(document.getElementById(pageHelpDrawerSectionDomId("what-to-do-next"))).toBeInTheDocument();

      await waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled();
      });
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }
  });
});
