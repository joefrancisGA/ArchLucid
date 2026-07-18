import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageScopedContextualHelpPanel } from "@/components/usability/PageScopedContextualHelpPanel";
import type { PageContextualHelpEntry } from "@/lib/contextual-help-registry";

const FULL_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage: "Short page summary.",
  whatToDoNext: "Do the next thing.",
  whyEmpty: "Empty because nothing happened yet.",
  whereToConfigurePrerequisite: "Configure prerequisites in settings UI.",
};

describe("PageScopedContextualHelpPanel", () => {
  it("renders available fields and the learn more link", () => {
    render(
      <PageScopedContextualHelpPanel
        entry={FULL_ENTRY}
        triggerLabel="Reviews"
        learnMoreHref="/help/review-packages"
      />,
    );

    fireEvent.click(screen.getByTestId("page-contextual-help-button"));

    expect(screen.getByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByText("Short page summary.")).toBeInTheDocument();
    expect(screen.getByText("Do the next thing.")).toBeInTheDocument();
    expect(screen.getByText("Empty because nothing happened yet.")).toBeInTheDocument();
    expect(screen.getByText("Configure prerequisites in settings UI.")).toBeInTheDocument();

    const learnMore = screen.getByTestId("page-scoped-contextual-help-learn-more");

    expect(learnMore).toHaveAttribute("href", "/help/review-packages");
  });

  it("omits optional fields and learn more when absent", () => {
    render(
      <PageScopedContextualHelpPanel
        entry={{
          whatIsThisPage: "Only required fields.",
          whatToDoNext: "Next step only.",
        }}
        triggerLabel="Fallback"
        learnMoreHref={null}
      />,
    );

    fireEvent.click(screen.getByTestId("page-contextual-help-button"));

    expect(screen.queryByText("Why is this empty?")).not.toBeInTheDocument();
    expect(screen.queryByText("Where to configure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-scoped-contextual-help-learn-more")).not.toBeInTheDocument();
  });
});
