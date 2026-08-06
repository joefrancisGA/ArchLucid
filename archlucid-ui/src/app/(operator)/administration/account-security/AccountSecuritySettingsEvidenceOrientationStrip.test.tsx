import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountSecuritySettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/account-security/AccountSecuritySettingsEvidenceOrientationStrip";
import {
  ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH,
  ACCOUNT_SECURITY_SETTINGS_SOURCES,
} from "@/lib/account-security-settings-evidence-copy";

describe("AccountSecuritySettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Account security", () => {
    render(<AccountSecuritySettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("account-security-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("account-security-settings-claim-discipline")).toBeInTheDocument();

    for (const link of ACCOUNT_SECURITY_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ACCOUNT_SECURITY_SETTINGS_SOURCES.some(
        (link) => link.href === ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
