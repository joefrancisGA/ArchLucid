import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LivelihoodPersistSaveStatus } from "@/components/operator/LivelihoodPersistSaveStatus";

describe("LivelihoodPersistSaveStatus", () => {
  it("shows last saved after a successful persist", () => {
    render(<LivelihoodPersistSaveStatus lastSavedUtc="2026-07-18T22:00:00.000Z" inlineSaveError={null} />);

    expect(screen.getByTestId("livelihood-persist-save-status-last-saved")).toHaveTextContent(/^Last saved /);
    expect(screen.queryByTestId("livelihood-persist-save-status-inline-save-error")).not.toBeInTheDocument();
  });

  it("shows inline retry on failed save without a last-saved label", () => {
    render(
      <LivelihoodPersistSaveStatus
        lastSavedUtc={null}
        inlineSaveError="Could not save connection."
      />,
    );

    expect(screen.getByTestId("livelihood-persist-save-status-inline-save-error")).toHaveTextContent(
      "Could not save connection.",
    );
    expect(screen.queryByTestId("livelihood-persist-save-status-last-saved")).not.toBeInTheDocument();
  });
});
