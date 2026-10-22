import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";
import {
  SCIM_IDENTITY_PROVIDERS_COMPACT_LINE,
  SCIM_IDENTITY_PROVIDERS_HEADING,
  SCIM_IDENTITY_PROVIDERS_IDP_LINK,
  SCIM_IDENTITY_PROVIDERS_SCIM_LINK,
  SCIM_IDENTITY_PROVIDERS_WHY_TWO,
} from "@/lib/vocabulary/scim-identity-providers-vocabulary";

describe("ScimIdentityProvidersVocabularyRail (TB-2294)", () => {
  it("renders scim-provisioning strip with peer link to identity providers", () => {
    render(<ScimIdentityProvidersVocabularyRail currentSurfaceId="scim-provisioning" />);

    const strip = screen.getByTestId("scim-identity-providers-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "scim-provisioning");
    expect(strip.textContent ?? "").toContain(SCIM_IDENTITY_PROVIDERS_COMPACT_LINE);

    const peer = screen.getByTestId("scim-identity-providers-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SCIM_IDENTITY_PROVIDERS_IDP_LINK.label);
    expect(peer).toHaveAttribute("href", SCIM_IDENTITY_PROVIDERS_IDP_LINK.href);
  });

  it("renders identity-providers strip with peer link to SCIM", () => {
    render(<ScimIdentityProvidersVocabularyRail currentSurfaceId="identity-providers" />);

    const peer = screen.getByTestId("scim-identity-providers-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SCIM_IDENTITY_PROVIDERS_SCIM_LINK.label);
    expect(peer).toHaveAttribute("href", SCIM_IDENTITY_PROVIDERS_SCIM_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ScimIdentityProvidersVocabularyRail currentSurfaceId="scim-provisioning" variant="full" />,
    );

    expect(screen.getByText(SCIM_IDENTITY_PROVIDERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SCIM_IDENTITY_PROVIDERS_WHY_TWO)).toBeInTheDocument();
  });
});
