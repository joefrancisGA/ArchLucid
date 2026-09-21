import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FirstSessionPurposeChooser } from "@/components/auth/FirstSessionPurposeChooser";
import {
  FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID,
  FIRST_SESSION_PURPOSE_LIVE_CTA,
  FIRST_SESSION_PURPOSE_TRAINING_CTA,
} from "@/lib/auth/first-session-purpose-copy";

describe("FirstSessionPurposeChooser", () => {
  it("shows both visible-boundary choices without Record or Practice segments", () => {
    render(
      <FirstSessionPurposeChooser
        open={true}
        pending={false}
        onChooseLive={vi.fn()}
        onChooseTraining={vi.fn()}
      />,
    );

    expect(screen.getByTestId(FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: FIRST_SESSION_PURPOSE_LIVE_CTA })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: FIRST_SESSION_PURPOSE_TRAINING_CTA })).toBeInTheDocument();
    expect(screen.queryByText("Record")).not.toBeInTheDocument();
    expect(screen.queryByText("Practice")).not.toBeInTheDocument();
  });
});
