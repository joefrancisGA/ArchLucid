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

describe("tenant branding ship gate (BR-09)", () => {
  it("operator masthead does not render another tenant display name from stale presentation payload", () => {
    brandingQueryMock.data = {
      mastheadDisplayName: "Tenant A Holdings",
      usesTenantVisualBrand: true,
      isProductBrand: false,
      showPoweredByArchLucid: false,
      colors: { primary: "#0f766e" },
      logoContentPath: "v1/infra-evidence/branding/logo/a/content",
    };

    renderWithOperatorQuery(
      <TenantMastheadWordmark href="/" aria-label="Workspace home" variant="operator" />,
    );

    expect(screen.getByTestId("tenant-masthead-display-name")).toHaveTextContent("Tenant A Holdings");
    expect(screen.queryByText("Tenant B Holdings")).not.toBeInTheDocument();
  });

  it("operator masthead falls back to product wordmark when tenant brand is inactive", () => {
    brandingQueryMock.data = {
      mastheadDisplayName: ProductBrandingDefaultsName,
      usesTenantVisualBrand: false,
      isProductBrand: true,
      showPoweredByArchLucid: false,
      colors: {},
      logoContentPath: null,
    };

    renderWithOperatorQuery(
      <TenantMastheadWordmark href="/" aria-label="Workspace home" variant="operator" />,
    );

    expect(screen.getByTestId("archlucid-wordmark-link")).toBeInTheDocument();
    expect(screen.queryByTestId("tenant-masthead-display-name")).not.toBeInTheDocument();
  });
});

const ProductBrandingDefaultsName = "ArchLucid";
