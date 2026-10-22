import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OidcDiagnosticsStrip } from "./OidcDiagnosticsStrip";
import { IDENTITY_PROVIDERS_STATUS_HEALTHY } from "@/lib/identity-providers-settings-copy";

describe("OidcDiagnosticsStrip", () => {
  it("renders discovery status with StatusTag and human label (TB-1907)", () => {
    render(
      <OidcDiagnosticsStrip
        payload={{
          authMode: "JwtBearer",
          configuredAuthority: "https://login.example.com/",
          configuredAudience: "api://demo",
          discoveryAttempted: true,
          discoverySucceeded: true,
          openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
        }}
        fetchNote={null}
      />,
    );

    expect(screen.getByTestId("oidc-diagnostics-discovery-status")).toHaveTextContent(
      IDENTITY_PROVIDERS_STATUS_HEALTHY,
    );
  });
});
