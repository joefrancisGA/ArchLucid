import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SsoWizardScimVocabularyRail } from "@/components/SsoWizardScimVocabularyRail";
import {
  SSO_WIZARD_SCIM_COMPACT_LINE,
  SSO_WIZARD_SCIM_HEADING,
  SSO_WIZARD_SCIM_SCIM_LINK,
  SSO_WIZARD_SCIM_SSO_WIZARD_LINK,
  SSO_WIZARD_SCIM_WHY_TWO,
} from "@/lib/vocabulary/sso-wizard-scim-vocabulary";

describe("SsoWizardScimVocabularyRail (TB-2326)", () => {
  it("renders sso-wizard strip with peer link to SCIM", () => {
    render(<SsoWizardScimVocabularyRail currentSurfaceId="sso-wizard" />);

    const strip = screen.getByTestId("sso-wizard-scim-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "sso-wizard");
    expect(strip.textContent ?? "").toContain(SSO_WIZARD_SCIM_COMPACT_LINE);

    const peer = screen.getByTestId("sso-wizard-scim-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SSO_WIZARD_SCIM_SCIM_LINK.label);
    expect(peer).toHaveAttribute("href", SSO_WIZARD_SCIM_SCIM_LINK.href);
  });

  it("renders scim strip with peer link to SSO wizard", () => {
    render(<SsoWizardScimVocabularyRail currentSurfaceId="scim" />);

    expect(screen.getByTestId("sso-wizard-scim-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "scim",
    );

    const peer = screen.getByTestId("sso-wizard-scim-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SSO_WIZARD_SCIM_SSO_WIZARD_LINK.label);
    expect(peer).toHaveAttribute("href", SSO_WIZARD_SCIM_SSO_WIZARD_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<SsoWizardScimVocabularyRail currentSurfaceId="sso-wizard" variant="full" />);

    const strip = screen.getByTestId("sso-wizard-scim-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(SSO_WIZARD_SCIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SSO_WIZARD_SCIM_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("sso-wizard-scim-vocabulary-current")).toHaveTextContent(
      SSO_WIZARD_SCIM_SSO_WIZARD_LINK.label,
    );
  });
});
