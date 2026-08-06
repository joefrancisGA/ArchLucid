import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProvidersSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsEvidenceOrientationStrip";
import {
  IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH,
  IDENTITY_PROVIDERS_SETTINGS_SOURCES,
} from "@/lib/identity-providers-settings-evidence-copy";

describe("IdentityProvidersSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the identity-providers hub", () => {
    render(<IdentityProvidersSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("identity-providers-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-settings-claim-discipline")).toBeInTheDocument();

    for (const link of IDENTITY_PROVIDERS_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      IDENTITY_PROVIDERS_SETTINGS_SOURCES.some(
        (link) => link.href === IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
