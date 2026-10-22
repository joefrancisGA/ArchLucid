import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SsoActivateConsequencePreview } from "@/components/SsoActivateConsequencePreview";
import { SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE } from "@/lib/sso-activate-consequence-preview";

describe("SsoActivateConsequencePreview (TB-2241)", () => {
  it("renders who signs in, unchanged until activate, and rollback/bypass rows", () => {
    render(<SsoActivateConsequencePreview />);

    expect(screen.getByTestId("sso-activate-consequence-preview")).toBeInTheDocument();
    expect(screen.getByText(SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("sso-activate-consequence-preview-whoSignsInNext")).toBeInTheDocument();
    expect(
      screen.getByTestId("sso-activate-consequence-preview-staysUnchangedUntilActivate"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("sso-activate-consequence-preview-rollsBackOrBypass")).toBeInTheDocument();
  });
});
