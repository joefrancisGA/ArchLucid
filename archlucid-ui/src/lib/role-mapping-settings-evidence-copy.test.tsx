import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleMappingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ROLE_MAPPING_SETTINGS_CANONICAL_PATH,
  ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE,
  ROLE_MAPPING_SETTINGS_SOURCES,
  ROLE_MAPPING_SETTINGS_SOURCES_INTRO,
} from "@/lib/role-mapping-settings-evidence-copy";

describe("role-mapping-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(ROLE_MAPPING_SETTINGS_CANONICAL_PATH).toBe("/administration/identity-providers/role-mapping");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<RoleMappingSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("role-mapping-settings-claim-discipline")).not.toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
