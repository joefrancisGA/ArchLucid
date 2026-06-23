import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";

import "@testing-library/jest-dom/vitest";

/** Opt into advanced wizard configuration before tests that need the mode toggle. */
export async function optIntoAdvancedNewRunWizardConfiguration(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText("Loading wizard…")).not.toBeInTheDocument();
  });

  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Show all wizard steps (advanced configuration)" }),
    );
  });

  await waitFor(() => {
    expect(screen.getByTestId("new-run-wizard-mode-toggle")).toBeInTheDocument();
  });
}
