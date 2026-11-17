import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    usePathname: () => "/help/audit-trail",
  });
});
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { AuditTrailHelpEvidenceOrientationStrip } from "@/components/help/AuditTrailHelpEvidenceOrientationStrip";
import {
  AUDIT_TRAIL_HELP_CANONICAL_PATH,
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";

describe("AuditTrailHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups because claim discipline is folded into the page header", () => {
    render(<AuditTrailHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("audit-trail-help-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("help-audit-trail-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );

    expectWhereToGoNextFollowUpLinks(screen, AUDIT_TRAIL_HELP_SOURCES, AUDIT_TRAIL_HELP_CANONICAL_PATH);
  });
});
