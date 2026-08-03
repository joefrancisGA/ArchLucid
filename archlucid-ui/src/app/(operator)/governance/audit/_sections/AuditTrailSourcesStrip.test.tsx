import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditTrailSourcesStrip } from "@/app/(operator)/governance/audit/_sections/AuditTrailSourcesStrip";
import { AUDIT_TRAIL_CANONICAL_PATH, AUDIT_TRAIL_SOURCES } from "@/lib/audit-trail-evidence-copy";

describe("AuditTrailSourcesStrip", () => {
  it("lists follow-up Sources without self-linking audit", () => {
    render(<AuditTrailSourcesStrip />);

    expect(screen.getByTestId("audit-trail-sources")).toBeInTheDocument();
    expect(screen.getByTestId("audit-trail-claim-discipline")).toHaveTextContent(/Activity log/i);

    const sources = screen.getByTestId("audit-trail-sources");

    for (const link of AUDIT_TRAIL_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AUDIT_TRAIL_SOURCES.some((link) => link.href === AUDIT_TRAIL_CANONICAL_PATH)).toBe(false);
  });
});
