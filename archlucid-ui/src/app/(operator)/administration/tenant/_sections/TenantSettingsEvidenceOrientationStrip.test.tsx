import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/tenant/_sections/TenantSettingsEvidenceOrientationStrip";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  TENANT_SETTINGS_SOURCES,
} from "@/lib/tenant-settings-evidence-copy";

describe("TenantSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Tenant settings", () => {
    render(<TenantSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("tenant-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-settings-claim-discipline")).toBeInTheDocument();

    for (const link of TENANT_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(TENANT_SETTINGS_SOURCES.some((link) => link.href === TENANT_SETTINGS_CANONICAL_PATH)).toBe(false);
  });
});
