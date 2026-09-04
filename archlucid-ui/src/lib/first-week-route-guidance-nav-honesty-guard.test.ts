import { describe, expect, it } from "vitest";

import {
  FIRST_WEEK_ROUTE_GUIDANCE,
  GUIDED_COMMITTED_OPERATE_UNLOCK_NOTE,
  GUIDED_OPERATE_SIDEBAR_DEFERRAL_NOTE,
  resolveFirstWeekRouteGuidanceForShell,
  type FirstWeekRouteGuidanceVariant,
} from "@/lib/first-week-route-guidance";

const WORKING_FORBIDDEN_PHRASES = [
  /stay out of the sidebar/i,
  /unlock in the sidebar after your first committed/i,
  /Graph, Compare, and heavy approval surfaces stay out of the sidebar/i,
] as const;

const WORKING_VARIANTS: FirstWeekRouteGuidanceVariant[] = [
  "home",
  "onboarding",
  "review-detail-committed",
  "new-review",
  "reviews-list",
];

describe("first-week route guidance nav honesty guard (CD-14)", () => {
  it("Working-resolved configs do not claim Operate sidebar lock", () => {
    for (const variant of WORKING_VARIANTS) {
      const config = resolveFirstWeekRouteGuidanceForShell(variant, { evalChrome: false });
      const note = config.operateDeferralNote;

      for (const pattern of WORKING_FORBIDDEN_PHRASES) {
        expect(note).not.toMatch(pattern);
      }
    }
  });

  it("Guided home may still use first-session sidebar deferral copy", () => {
    const guidedHome = resolveFirstWeekRouteGuidanceForShell("home", { evalChrome: true });

    expect(guidedHome.operateDeferralNote).toBe(GUIDED_OPERATE_SIDEBAR_DEFERRAL_NOTE);
  });

  it("Guided committed review detail may still mention sidebar unlock after first commit", () => {
    const guidedCommitted = resolveFirstWeekRouteGuidanceForShell("review-detail-committed", {
      evalChrome: true,
    });

    expect(guidedCommitted.operateDeferralNote).toBe(GUIDED_COMMITTED_OPERATE_UNLOCK_NOTE);
  });

  it("reverting Working home copy to Guided deferral would fail the guard", () => {
    const lyingWorkingHome = {
      ...resolveFirstWeekRouteGuidanceForShell("home", { evalChrome: false }),
      operateDeferralNote: FIRST_WEEK_ROUTE_GUIDANCE.home.operateDeferralNote,
    };

    expect(lyingWorkingHome.operateDeferralNote).toMatch(WORKING_FORBIDDEN_PHRASES[0]);
  });
});
