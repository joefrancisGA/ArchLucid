import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";

describe("tenant-settings-evidence-copy", () => {
  it("wires exports into the Tenant settings evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("tenant-settings-evidence-copy");
    expect(registrySource).toContain("TenantSettingsEvidenceOrientationStrip");
    expect(TENANT_SETTINGS_CANONICAL_PATH).toBe("/administration/workspace-settings");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TenantSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("tenant-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(TENANT_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("tenant-settings-sources");

    for (const link of TENANT_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${TENANT_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<TenantSettingsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: TENANT_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
