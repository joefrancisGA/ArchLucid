import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProviderHealthStrip } from "./IdentityProviderHealthStrip";
import { IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE } from "@/lib/identity-providers-settings-copy";

describe("IdentityProviderHealthStrip", () => {
  it("renders humanized probe statuses with StatusTag instead of raw API enums (TB-1907)", () => {
    render(
      <IdentityProviderHealthStrip
        payload={{
          oidc: { status: "Healthy", summary: "OIDC configured." },
          saml: { status: "NotApplicable", summary: "SAML disabled." },
        }}
        fetchNote={null}
      />,
    );

    expect(screen.getByTestId("identity-provider-health-status-oidc")).toHaveTextContent("Healthy");
    expect(screen.getByTestId("identity-provider-health-status-saml")).toHaveTextContent(
      IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
    );
    expect(screen.queryByText("NotApplicable")).not.toBeInTheDocument();
  });
});
