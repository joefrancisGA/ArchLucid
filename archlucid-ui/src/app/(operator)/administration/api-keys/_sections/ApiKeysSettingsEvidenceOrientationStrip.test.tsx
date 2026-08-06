import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeysSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/api-keys/_sections/ApiKeysSettingsEvidenceOrientationStrip";
import {
  API_KEYS_SETTINGS_CANONICAL_PATH,
  API_KEYS_SETTINGS_SOURCES,
} from "@/lib/api-keys-settings-evidence-copy";

describe("ApiKeysSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking API keys", () => {
    render(<ApiKeysSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("api-keys-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-settings-claim-discipline")).toBeInTheDocument();

    for (const link of API_KEYS_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      API_KEYS_SETTINGS_SOURCES.some((link) => link.href === API_KEYS_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
