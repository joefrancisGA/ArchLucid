import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsFindingsDualInboxReconciler } from "@/components/AlertsFindingsDualInboxReconciler";
import {
  ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK,
  ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE,
  ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK,
  ALERTS_FINDINGS_DUAL_INBOX_HEADING,
  ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO,
} from "@/lib/alerts-findings-dual-inbox";

describe("AlertsFindingsDualInboxReconciler (TB-2221 / TB-2319)", () => {
  it("renders compact strip on alerts inbox with peer link to findings", () => {
    render(<AlertsFindingsDualInboxReconciler currentSurfaceId="alerts-inbox" />);

    const strip = screen.getByTestId("alerts-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "alerts-inbox");
    expect(strip.textContent ?? "").toContain(ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE);

    const peer = screen.getByTestId("alerts-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK.label);
    expect(peer).toHaveAttribute("href", ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK.href);
  });

  it("renders compact strip on findings queue with peer link to alerts", () => {
    render(<AlertsFindingsDualInboxReconciler currentSurfaceId="findings-queue" />);

    expect(screen.getByTestId("alerts-findings-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "findings-queue",
    );

    const peer = screen.getByTestId("alerts-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK.label);
    expect(peer).toHaveAttribute("href", ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AlertsFindingsDualInboxReconciler currentSurfaceId="alerts-inbox" variant="full" />,
    );

    const strip = screen.getByTestId("alerts-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ALERTS_FINDINGS_DUAL_INBOX_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("alerts-findings-vocabulary-current")).toHaveTextContent(
      ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK.label,
    );
  });
});
