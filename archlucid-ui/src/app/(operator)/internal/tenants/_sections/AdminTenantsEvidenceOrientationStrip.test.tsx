import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminTenantsEvidenceOrientationStrip } from "@/app/(operator)/internal/tenants/_sections/AdminTenantsEvidenceOrientationStrip";
import {
  ADMIN_TENANTS_CANONICAL_PATH,
  ADMIN_TENANTS_SOURCES,
} from "@/lib/admin-tenants-evidence-copy";

describe("AdminTenantsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking tenants admin", () => {
    render(<AdminTenantsEvidenceOrientationStrip />);

    expect(screen.getByTestId("admin-tenants-sources")).toBeInTheDocument();
    expect(screen.getByTestId("admin-tenants-claim-discipline")).toBeInTheDocument();

    for (const link of ADMIN_TENANTS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ADMIN_TENANTS_SOURCES.some((link) => link.href === ADMIN_TENANTS_CANONICAL_PATH)).toBe(false);
  });
});
