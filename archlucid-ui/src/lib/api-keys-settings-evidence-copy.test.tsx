import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeysSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  API_KEYS_OPERATOR_CANONICAL_PATH,
  API_KEYS_SETTINGS_FOLLOW_UPS_TITLE,
  API_KEYS_SETTINGS_SOURCES,
  API_KEYS_SETTINGS_SOURCES_INTRO,
} from "@/lib/api-keys-settings-evidence-copy";

describe("api-keys-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(API_KEYS_OPERATOR_CANONICAL_PATH).toBe("/administration/api-keys");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ApiKeysSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("api-keys-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(API_KEYS_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("api-keys-settings-sources");

    for (const link of API_KEYS_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${API_KEYS_OPERATOR_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ApiKeysSettingsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: API_KEYS_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
