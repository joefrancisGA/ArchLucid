import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product-line/resolve-product-line-id", () => ({
  resolveProductLineIdFromEnv: () => "security",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { MarketingSecurityTrustView } from "@/components/marketing/MarketingSecurityTrustView";
import { assuranceStatusHeroSupporting } from "@/lib/security-trust-product-copy";

describe("MarketingSecurityTrustView security shell", () => {
  it("names SecureNow in the assurance hero on the security process", () => {
    render(<MarketingSecurityTrustView />);

    expect(screen.getByText(assuranceStatusHeroSupporting("security"))).toBeInTheDocument();
    expect(screen.getAllByText(/security@archlucid\.net/i).length).toBeGreaterThan(0);
  });
});
