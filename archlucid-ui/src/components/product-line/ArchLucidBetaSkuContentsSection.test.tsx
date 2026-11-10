import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchLucidBetaSkuContentsSection } from "@/components/product-line/ArchLucidBetaSkuContentsSection";
import {
  ARCHLUCID_BETA_SKU_CONTENTS_HEADING,
  ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_HREF,
  ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_LABEL,
} from "@/lib/product-line/archlucid-beta-sku-contents-copy";

describe("ArchLucidBetaSkuContentsSection", () => {
  it("lists beta includes and excludes with quote link", () => {
    render(<ArchLucidBetaSkuContentsSection />);

    expect(screen.getByTestId("archlucid-beta-sku-contents-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ARCHLUCID_BETA_SKU_CONTENTS_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_LABEL })).toHaveAttribute(
      "href",
      ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_HREF,
    );
    expect(screen.getByText(/accepts a guided-pilot evaluation order/i)).toBeInTheDocument();
  });
});
