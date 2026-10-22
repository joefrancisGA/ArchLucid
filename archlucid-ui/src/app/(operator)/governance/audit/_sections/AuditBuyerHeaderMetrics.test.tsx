import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditBuyerHeaderMetrics } from "./AuditBuyerHeaderMetrics";

describe("AuditBuyerHeaderMetrics", () => {
  it("links queue totals to audit action filters and keeps last activity non-link", () => {
    render(
      <AuditBuyerHeaderMetrics
        buyerAuditTrailMetrics={{
          totalEvents: 42,
          decisions: 5,
          evidenceChanges: 8,
          approvals: 2,
          exports: 1,
          lastActivityUtc: "2026-01-15T12:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("audit-buyer-metric-decisions")).toHaveAttribute(
      "href",
      "/governance/audit?action=finding.approved",
    );
    expect(screen.getByTestId("audit-buyer-metric-last-activity")).not.toHaveAttribute("href");
  });
});
