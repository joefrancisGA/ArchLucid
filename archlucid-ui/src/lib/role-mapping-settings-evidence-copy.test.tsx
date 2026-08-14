import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleMappingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ROLE_MAPPING_SETTINGS_CANONICAL_PATH,
  ROLE_MAPPING_SETTINGS_CLAIM_DISCIPLINE,
  ROLE_MAPPING_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  ROLE_MAPPING_SETTINGS_CLAIM_HEADING_ID,
  ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE,
  ROLE_MAPPING_SETTINGS_SOURCES,
  ROLE_MAPPING_SETTINGS_SOURCES_INTRO,
} from "@/lib/role-mapping-settings-evidence-copy";

describe("role-mapping-settings-evidence-copy", () => {
  it("wires exports into the Role mapping settings evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("role-mapping-settings-evidence-copy");
    expect(registrySource).toContain("RoleMappingSettingsEvidenceOrientationStrip");
    expect(ROLE_MAPPING_SETTINGS_CANONICAL_PATH).toBe("/administration/identity-providers/role-mapping");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<RoleMappingSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("role-mapping-settings-claim-discipline")).toHaveTextContent(
      ROLE_MAPPING_SETTINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(ROLE_MAPPING_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("role-mapping-settings-sources");

    for (const link of ROLE_MAPPING_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${ROLE_MAPPING_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<RoleMappingSettingsEvidenceOrientationStrip />);

    const claim = screen.getByTestId("role-mapping-settings-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", ROLE_MAPPING_SETTINGS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: ROLE_MAPPING_SETTINGS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
