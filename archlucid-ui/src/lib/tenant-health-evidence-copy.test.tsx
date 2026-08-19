import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TENANT_HEALTH_CANONICAL_PATH,
  TENANT_HEALTH_FOLLOW_UPS_TITLE,
  TENANT_HEALTH_SOURCES,
  TENANT_HEALTH_SOURCES_INTRO,
} from "@/lib/tenant-health-evidence-copy";

describe("tenant-health-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(TENANT_HEALTH_CANONICAL_PATH).toBe("/internal/tenant-health");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TenantHealthEvidenceOrientationStrip />);

    expect(screen.queryByTestId("tenant-health-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(TENANT_HEALTH_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("tenant-health-sources");

    for (const link of TENANT_HEALTH_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${TENANT_HEALTH_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<TenantHealthEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: TENANT_HEALTH_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
