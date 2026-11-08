import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreferencesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import {
  PREFERENCES_SETTINGS_CANONICAL_PATH,
  PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE,
  PREFERENCES_SETTINGS_SOURCES_INTRO,
  preferencesSettingsSources,
} from "@/lib/preferences-settings-evidence-copy";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

describe("preferences-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(PREFERENCES_SETTINGS_CANONICAL_PATH).toBe("/account/preferences");
  });

  it("renders operator Sources follow-ups without a claim-discipline band", () => {
    const productLineId = resolveProductLineIdFromEnv();
    render(<PreferencesSettingsEvidenceOrientationStrip productLineId={productLineId} />);

    expect(screen.queryByTestId("preferences-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(PREFERENCES_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("preferences-settings-sources");

    expectWhereToGoNextFollowUpLinks(
      within(sourcesSection),
      preferencesSettingsSources(productLineId),
      PREFERENCES_SETTINGS_CANONICAL_PATH,
    );

    expect(
      within(sourcesSection).queryByRole("link", { name: new RegExp(`^${PREFERENCES_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<PreferencesSettingsEvidenceOrientationStrip />);

    expect(screen.getByRole("heading", { name: PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
