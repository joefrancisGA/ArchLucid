import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { requestReviewsNewWizardAutoRestore } from "@/lib/reviews-new-wizard-session-resume";
import { WIZARD_SESSION_IDS, writeWizardSessionSnapshot } from "@/lib/wizard-session-persistence";

type TestState = {
  readonly title: string;
};

function TestHarness(props: {
  readonly state: TestState;
  readonly onRestore: (title: string) => void;
}) {
  const persistence = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.reviewsNewQuickStart,
    stepIndex: 0,
    state: props.state,
    hasSaveableContent: (state) => state.title.trim().length > 0,
    onRestore: (snapshot) => {
      props.onRestore(snapshot.state.title);
    },
  });

  return (
    <div>
      {persistence.pendingRestore !== null ? (
        <button type="button" onClick={persistence.acceptRestore}>
          Resume saved wizard
        </button>
      ) : null}
      <span data-testid="save-state">{persistence.saveState}</span>
    </div>
  );
}

describe("useWizardSessionPersistence (TB-2157)", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("offers resume when a saved wizard snapshot exists", async () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { title: "Saved title" },
    });

    const onRestore = vi.fn();

    render(<TestHarness state={{ title: "" }} onRestore={onRestore} />);

    expect(screen.getByRole("button", { name: "Resume saved wizard" })).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button", { name: "Resume saved wizard" }).click();
    });

    expect(onRestore).toHaveBeenCalledWith("Saved title");
  });

  it("auto-accepts restore when the hub resume strip requested it", async () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { title: "Saved title" },
    });
    requestReviewsNewWizardAutoRestore(WIZARD_SESSION_IDS.reviewsNewQuickStart);

    const onRestore = vi.fn();

    render(<TestHarness state={{ title: "" }} onRestore={onRestore} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole("button", { name: "Resume saved wizard" })).not.toBeInTheDocument();
    expect(onRestore).toHaveBeenCalledWith("Saved title");
  });
});
