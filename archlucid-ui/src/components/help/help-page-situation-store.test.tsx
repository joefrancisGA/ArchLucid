import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HelpPageSituationRegistrar } from "@/components/help/HelpPageSituationRegistrar";
import {
  getHelpPageSituation,
  setHelpPageSituation,
  subscribeHelpPageSituation,
  useHelpPageSituation,
} from "@/components/help/help-page-situation-store";

function SituationProbe(): React.JSX.Element {
  const situation = useHelpPageSituation();

  return <span data-testid="situation">{situation ?? "none"}</span>;
}

afterEach(() => {
  setHelpPageSituation(null);
});

describe("help-page-situation-store", () => {
  it("starts with no published situation", () => {
    expect(getHelpPageSituation()).toBeNull();
  });

  it("notifies subscribers only when the situation changes", () => {
    let notifications = 0;
    const unsubscribe = subscribeHelpPageSituation(() => {
      notifications += 1;
    });

    setHelpPageSituation("review-approval-blocked");
    setHelpPageSituation("review-approval-blocked");
    setHelpPageSituation("review-evidence-incomplete");

    expect(notifications).toBe(2);

    unsubscribe();
    setHelpPageSituation(null);

    expect(notifications).toBe(2);
  });

  it("publishes the registrar situation to subscribed readers", () => {
    render(
      <>
        <HelpPageSituationRegistrar situation="review-approval-blocked" />
        <SituationProbe />
      </>,
    );

    expect(screen.getByTestId("situation")).toHaveTextContent("review-approval-blocked");
  });

  it("clears the situation when the publishing page unmounts", () => {
    const view = render(<HelpPageSituationRegistrar situation="review-approval-blocked" />);

    expect(getHelpPageSituation()).toBe("review-approval-blocked");

    view.unmount();

    expect(getHelpPageSituation()).toBeNull();
  });

  it("publishes nothing when the page has no situation", () => {
    render(<HelpPageSituationRegistrar situation={null} />);

    expect(getHelpPageSituation()).toBeNull();
  });
});
