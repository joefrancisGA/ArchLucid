import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsSecurityTrustEvidenceOrientationStrip } from "@/app/(operator)/administration/security-trust/_sections/SettingsSecurityTrustEvidenceOrientationStrip";
import {
  SETTINGS_SECURITY_TRUST_CANONICAL_PATH,
  SETTINGS_SECURITY_TRUST_SOURCES,
} from "@/lib/settings-security-trust-evidence-copy";

describe("SettingsSecurityTrustEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking settings security-trust", () => {
    render(<SettingsSecurityTrustEvidenceOrientationStrip />);

    expect(screen.getByTestId("settings-security-trust-sources")).toBeInTheDocument();
    expect(screen.getByTestId("settings-security-trust-claim-discipline")).toBeInTheDocument();

    for (const link of SETTINGS_SECURITY_TRUST_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      SETTINGS_SECURITY_TRUST_SOURCES.some((link) => link.href === SETTINGS_SECURITY_TRUST_CANONICAL_PATH),
    ).toBe(false);
  });
});
