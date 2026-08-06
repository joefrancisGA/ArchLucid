import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthDomainsSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/auth-domains/AuthDomainsSettingsEvidenceOrientationStrip";
import {
  AUTH_DOMAINS_SETTINGS_CANONICAL_PATH,
  AUTH_DOMAINS_SETTINGS_SOURCES,
} from "@/lib/auth-domains-settings-evidence-copy";

describe("AuthDomainsSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Sign-in domains", () => {
    render(<AuthDomainsSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("auth-domains-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-settings-claim-discipline")).toBeInTheDocument();

    for (const link of AUTH_DOMAINS_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      AUTH_DOMAINS_SETTINGS_SOURCES.some((link) => link.href === AUTH_DOMAINS_SETTINGS_CANONICAL_PATH),
    ).toBe(false);
  });
});
