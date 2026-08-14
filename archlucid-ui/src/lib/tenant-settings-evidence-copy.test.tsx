import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TenantSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  TENANT_SETTINGS_CLAIM_DISCIPLINE,
  TENANT_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  TENANT_SETTINGS_CLAIM_HEADING_ID,
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";

describe("tenant-settings-evidence-copy", () => {
  it("wires exports into the Tenant settings evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("tenant-settings-evidence-copy");
    expect(registrySource).toContain("TenantSettingsEvidenceOrientationStrip");
    expect(TENANT_SETTINGS_CANONICAL_PATH).toBe("/administration/workspace-settings");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TenantSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("tenant-settings-claim-discipline")).toHaveTextContent(TENANT_SETTINGS_CLAIM_DISCIPLINE);
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

    const claim = screen.getByTestId("tenant-settings-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", TENANT_SETTINGS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: TENANT_SETTINGS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: TENANT_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
