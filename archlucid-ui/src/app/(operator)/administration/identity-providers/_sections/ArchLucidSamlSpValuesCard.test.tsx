import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchLucidSamlSpValuesCard } from "./ArchLucidSamlSpValuesCard";
import {
  IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL,
  IDENTITY_PROVIDERS_SAML_SP_ENTITY_ID_LABEL,
} from "@/lib/identity-providers-settings-copy";
import { SAML_SP_ACS_PATH } from "@/lib/saml-sp-acs-url";

describe("ArchLucidSamlSpValuesCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, origin: "https://console.example.com" },
    });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the copyable ACS path", async () => {
    render(<ArchLucidSamlSpValuesCard />);

    expect(screen.getByText(IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(IDENTITY_PROVIDERS_SAML_SP_ENTITY_ID_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("archlucid-saml-sp-acs-url")).toHaveTextContent(SAML_SP_ACS_PATH);

    fireEvent.click(screen.getByRole("button", { name: `Copy ${IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL}` }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: `Copy ${IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL}` })).toHaveTextContent(
        "Copied",
      );
    });
  });

  it("never presents the console origin as the reply URL host", () => {
    render(<ArchLucidSamlSpValuesCard />);

    // The ACS endpoint is served by the API host, so composing it from the console origin would
    // hand the administrator a reply URL that never receives SAML assertions.
    expect(screen.getByTestId("archlucid-saml-sp-acs-url")).not.toHaveTextContent("console.example.com");
    expect(screen.getByTestId("archlucid-saml-sp-values-card")).toHaveTextContent(/ArchLucid API host/i);
  });

  it("directs the administrator to the platform administrator for the SP entity ID", () => {
    render(<ArchLucidSamlSpValuesCard />);

    expect(screen.getByTestId("archlucid-saml-sp-entity-id-unavailable")).toHaveTextContent(
      /Ask your platform administrator/i,
    );
  });
});
