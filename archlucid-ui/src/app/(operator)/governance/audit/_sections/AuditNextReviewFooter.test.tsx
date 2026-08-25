import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditNextReviewFooter, auditTrailNextReviewHref } from "./AuditNextReviewFooter";

describe("AuditNextReviewFooter", () => {
  it("builds the next review audit href from run id", () => {
    expect(auditTrailNextReviewHref("run-2")).toBe("/governance/audit?runId=run-2");
    expect(auditTrailNextReviewHref("run 2")).toBe("/governance/audit?runId=run%202");
  });

  it("renders next review audit link", () => {
    render(
      <AuditNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/audit?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("audit-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review audit trail")).toBeInTheDocument();
    expect(screen.getByTestId("audit-next-review-action")).toHaveAttribute(
      "href",
      "/governance/audit?runId=run-2",
    );
  });
});
