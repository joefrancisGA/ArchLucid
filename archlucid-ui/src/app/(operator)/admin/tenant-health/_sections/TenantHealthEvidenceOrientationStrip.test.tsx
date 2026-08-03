import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantHealthEvidenceOrientationStrip } from "@/app/(operator)/admin/tenant-health/_sections/TenantHealthEvidenceOrientationStrip";
import {
  TENANT_HEALTH_CANONICAL_PATH,
  TENANT_HEALTH_SOURCES,
} from "@/lib/tenant-health-evidence-copy";

describe("TenantHealthEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking tenant-health", () => {
    render(<TenantHealthEvidenceOrientationStrip />);

    expect(screen.getByTestId("tenant-health-sources")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-health-claim-discipline")).toBeInTheDocument();

    for (const link of TENANT_HEALTH_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(TENANT_HEALTH_SOURCES.some((link) => link.href === TENANT_HEALTH_CANONICAL_PATH)).toBe(false);
  });
});
