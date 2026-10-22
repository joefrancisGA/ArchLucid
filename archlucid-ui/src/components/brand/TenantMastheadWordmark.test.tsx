import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TenantMastheadWordmark } from "@/components/brand/TenantMastheadWordmark";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const brandingQueryMock = vi.hoisted(() => ({
  data: null as {
    mastheadDisplayName: string;
    usesTenantVisualBrand: boolean;
    isProductBrand: boolean;
    showPoweredByArchLucid: boolean;
    colors: Record<string, string>;
    logoContentPath?: string | null;
  } | null,
}));

vi.mock("@/hooks/use-tenant-branding-presentation-query", () => ({
  useTenantBrandingPresentationQuery: () => ({ data: brandingQueryMock.data }),
}));

vi.mock("next/image", () => ({
  default: (props: { "data-testid"?: string; alt?: string }) => (
    <img data-testid={props["data-testid"] ?? "next-image-stub"} alt={props.alt ?? ""} />
  ),
}));

describe("TenantMastheadWordmark", () => {
  it("marketing variant keeps product wordmark without tenant branding query", () => {
    brandingQueryMock.data = {
      mastheadDisplayName: "Fabrikam Holdings",
      usesTenantVisualBrand: true,
      isProductBrand: false,
      showPoweredByArchLucid: false,
      colors: {},
      logoContentPath: "v1/infra-evidence/branding/logo/content",
    };

    render(
      <TenantMastheadWordmark href="/" aria-label="ArchLucid home" variant="marketing" />,
    );

    expect(screen.getByTestId("archlucid-wordmark-link")).toBeInTheDocument();
    expect(screen.queryByTestId("tenant-masthead-display-name")).not.toBeInTheDocument();
  });

  it("operator variant shows company display name when tenant visual brand is active", () => {
    brandingQueryMock.data = {
      mastheadDisplayName: "Fabrikam Holdings",
      usesTenantVisualBrand: true,
      isProductBrand: false,
      showPoweredByArchLucid: false,
      colors: { primary: "#0f766e" },
      logoContentPath: "v1/infra-evidence/branding/logo/content",
    };

    renderWithOperatorQuery(
      <TenantMastheadWordmark href="/" aria-label="Workspace home" variant="operator" />,
    );

    expect(screen.getByTestId("tenant-masthead-display-name")).toHaveTextContent("Fabrikam Holdings");
    expect(screen.queryByTestId("archlucid-wordmark-link")).not.toBeInTheDocument();
  });
});
