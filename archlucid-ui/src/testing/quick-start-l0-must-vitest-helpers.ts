import { fireEvent, screen } from "@testing-library/react";

/** Marks every L0 MUST clarification unknown so Quick start readiness passes in Vitest. */
export function satisfyAllQuickStartL0MustQuestions(): void {
  const skipButtons = screen.getAllByTestId("socratic-skip-clarification");

  for (const button of skipButtons) {
    fireEvent.click(button);
  }
}
