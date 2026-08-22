import type { Screen } from "@testing-library/react";
import { expect } from "vitest";

import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import type { EvidenceOrientationLink, EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Narrow link shapes used in evidence-copy modules. */
export type FollowUpLinkLike = EvidenceOrientationLink | EvidenceSourceLink;

/** Accessible name for a follow-up link when destination labeling is enabled. */
export function followUpLinkAccessibleName(href: string, label: string): string {
  return formatHelpFollowUpLinkAccessibleName(href, label);
}

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

/** Assert a labeled follow-up link inside a scoped region. */
export function expectFollowUpLink(
  region: Pick<Screen, "getByRole">,
  link: FollowUpLinkLike,
  options?: { readonly rawLabel?: boolean },
): void {
  const accessibleName =
    options?.rawLabel === true ? link.label : followUpLinkAccessibleName(link.href, link.label);

  expect(region.getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
}
