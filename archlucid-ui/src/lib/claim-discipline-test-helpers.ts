import type { Screen } from "@testing-library/react";

import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";

/** Assert claim-discipline visibility matches {@link shouldOmitClaimDisciplineBand} for a strip slug. */
export function expectClaimDisciplineBand(
  screen: Screen,
  stripSlug: string,
  testId: string,
): void {
  if (shouldOmitClaimDisciplineBand(stripSlug)) {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    return;
  }

  expect(screen.getByTestId(testId)).toBeInTheDocument();
}
