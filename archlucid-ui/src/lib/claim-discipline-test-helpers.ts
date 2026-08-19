import type { Screen } from "@testing-library/react";
import { expect } from "vitest";

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

/** Assert claim-discipline copy when visible; assert absence when the strip slug is omitted. */
export function expectClaimDisciplineBandContent(
  screen: Screen,
  stripSlug: string,
  testId: string,
  expectedSubstring: string,
): void {
  if (shouldOmitClaimDisciplineBand(stripSlug)) {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    return;
  }

  expect(screen.getByTestId(testId).textContent).toContain(expectedSubstring);
}

/** Assert the claim-discipline section heading when visible; assert absence when omitted. */
export function expectClaimDisciplineHeading(
  screen: Screen,
  stripSlug: string,
  headingName: string,
  headingId: string,
): void {
  if (shouldOmitClaimDisciplineBand(stripSlug)) {
    expect(screen.queryByRole("heading", { name: headingName })).not.toBeInTheDocument();
    return;
  }

  expect(screen.getByRole("heading", { name: headingName })).toHaveAttribute("id", headingId);
}
