import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleMappingSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/identity-providers/_sections/RoleMappingSettingsEvidenceOrientationStrip";
import {
  ROLE_MAPPING_SETTINGS_CANONICAL_PATH,
  ROLE_MAPPING_SETTINGS_SOURCES,
} from "@/lib/role-mapping-settings-evidence-copy";

describe("RoleMappingSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Role mapping", () => {
    render(<RoleMappingSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("role-mapping-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("role-mapping-settings-claim-discipline")).toBeInTheDocument();

    for (const link of ROLE_MAPPING_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ROLE_MAPPING_SETTINGS_SOURCES.some((link) => link.href === ROLE_MAPPING_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
