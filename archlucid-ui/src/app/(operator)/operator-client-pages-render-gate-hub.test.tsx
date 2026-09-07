import "./operator-client-pages-render-gate.setup.tsx";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import { DigestsBrowseContent } from "@/components/digests/DigestsBrowseContent";
import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

describe("operator client pages — render gate (hub tabs)", () => {
  it("Advisory hub Scans tab content renders primary heading", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Pick a review before scanning" }),
    ).toBeInTheDocument();
  });

  it("Advisory hub Schedules tab content renders primary heading", () => {
    render(<AdvisorySchedulesContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Schedule advisory scans" })).toBeInTheDocument();
  });

  it("Digests hub Browse tab content renders primary heading", () => {
    renderWithOperatorQuery(<DigestsBrowseContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Architecture digests" })).toBeInTheDocument();
  });

  it("Digests hub Subscriptions tab content renders primary heading", () => {
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);
    expect(screen.getByRole("heading", { level: 2, name: "Delivery destinations" })).toBeInTheDocument();
  });
});
