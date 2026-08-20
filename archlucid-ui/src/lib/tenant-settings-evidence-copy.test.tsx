import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { TenantSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";

describe("tenant-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(TENANT_SETTINGS_CANONICAL_PATH).toBe("/administration/workspace-settings");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TenantSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("tenant-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(TENANT_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("tenant-settings-sources");

    for (const link of TENANT_SETTINGS_SOURCES) {
      expectFollowUpLink(within(sources), link);
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
