import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SsoWizardEvidenceOrientationStrip } from "@/app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardEvidenceOrientationStrip";
import { SSO_WIZARD_CANONICAL_PATH, SSO_WIZARD_SOURCES } from "@/lib/sso-wizard-evidence-copy";

describe("SsoWizardEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking SSO wizard", () => {
    render(<SsoWizardEvidenceOrientationStrip />);

    expect(screen.getByTestId("sso-wizard-sources")).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-claim-discipline")).toBeInTheDocument();

    for (const link of SSO_WIZARD_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SSO_WIZARD_SOURCES.some((link) => link.href === SSO_WIZARD_CANONICAL_PATH)).toBe(false);
  });
});
