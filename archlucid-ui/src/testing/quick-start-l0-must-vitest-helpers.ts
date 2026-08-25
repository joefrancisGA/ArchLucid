import { fireEvent, screen } from "@testing-library/react";

/** Marks every L0 MUST clarification unknown so Quick start readiness passes in Vitest. */
export function satisfyAllQuickStartL0MustQuestions(): void {
  for (let index = 0; index < 12; index += 1) {
    const skipButton = screen.queryByTestId("socratic-skip-clarification");

    if (skipButton === null) {
      break;
    }

    fireEvent.click(skipButton);
  }
}
