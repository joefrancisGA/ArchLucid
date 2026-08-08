import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveDashboardEvidenceOrientationStrip } from "@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveDashboardEvidenceOrientationStrip";
import {
  ARCHITECTURE_EXECUTIVE_DASHBOARD_CANONICAL_PATH,
  ARCHITECTURE_EXECUTIVE_DASHBOARD_SOURCES,
} from "@/lib/architecture-executive-dashboard-evidence-copy";

describe("ExecutiveDashboardEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the executive dashboard", () => {
    render(<ExecutiveDashboardEvidenceOrientationStrip />);

    expect(screen.getByTestId("executive-dashboard-sources")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_EXECUTIVE_DASHBOARD_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ARCHITECTURE_EXECUTIVE_DASHBOARD_SOURCES.some(
        (link) => link.href === ARCHITECTURE_EXECUTIVE_DASHBOARD_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
