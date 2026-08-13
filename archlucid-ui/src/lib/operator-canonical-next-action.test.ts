import { describe, expect, it } from "vitest";

import {
  mapTenantNextBestActionToCanonical,
  resolveOperatorCanonicalNextAction,
  toOperatorCanonicalNextActionFromEmptyHome,
  toOperatorCanonicalNextActionFromPilot,
} from "@/lib/operator-canonical-next-action";

describe("operator-canonical-next-action (TB-2232)", () => {
  const clientFallback = {
    label: "Start a review",
    href: "/architecture/reviews/new",
    bridgeCopy: "Begin with your first architecture review.",
  };

  it("prefers the first tenant next-action row over client fallback", () => {
    const resolved = resolveOperatorCanonicalNextAction(
      [
        {
          actionId: "commit-latest",
          title: "Commit the latest architecture package",
          reason: "One review is finished but not committed.",
          href: "/architecture/reviews/run-1",
        },
      ],
      clientFallback,
    );

    expect(resolved).toEqual(
      mapTenantNextBestActionToCanonical({
        actionId: "commit-latest",
        title: "Commit the latest architecture package",
        reason: "One review is finished but not committed.",
        href: "/architecture/reviews/run-1",
      }),
    );
  });

  it("falls back to client lifecycle guidance when tenant actions are empty", () => {
    expect(resolveOperatorCanonicalNextAction([], clientFallback)).toEqual({
      ...clientFallback,
      source: "client-fallback",
    });
  });

  it("maps pilot and empty-home actions into canonical shape", () => {
    expect(
      toOperatorCanonicalNextActionFromPilot({
        label: "Review open findings",
        href: "/governance/findings?filter=open",
        bridgeCopy: "Triage material findings first.",
      }),
    ).toEqual({
      label: "Review open findings",
      href: "/governance/findings?filter=open",
      bridgeCopy: "Triage material findings first.",
    });

    expect(
      toOperatorCanonicalNextActionFromEmptyHome({
        kind: "setup",
        label: "Manage roles",
        href: "/administration/settings/users",
        bridgeCopy: "Assign an administrator before you start.",
      }),
    ).toEqual({
      label: "Manage roles",
      href: "/administration/settings/users",
      bridgeCopy: "Assign an administrator before you start.",
    });
  });
});
