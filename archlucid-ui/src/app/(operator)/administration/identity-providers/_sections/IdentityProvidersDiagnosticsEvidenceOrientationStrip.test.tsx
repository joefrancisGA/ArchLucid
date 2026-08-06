import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProvidersDiagnosticsEvidenceOrientationStrip } from "@/app/(operator)/administration/identity-providers/_sections/IdentityProvidersDiagnosticsEvidenceOrientationStrip";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH,
  IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES,
} from "@/lib/identity-providers-diagnostics-evidence-copy";

describe("IdentityProvidersDiagnosticsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Identity diagnostics", () => {
    render(<IdentityProvidersDiagnosticsEvidenceOrientationStrip />);

    expect(screen.getByTestId("identity-providers-diagnostics-sources")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-diagnostics-claim-discipline")).toBeInTheDocument();

    for (const link of IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES.some(
        (link) => link.href === IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
