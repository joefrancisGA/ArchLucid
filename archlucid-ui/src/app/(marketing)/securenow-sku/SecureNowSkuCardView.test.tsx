import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY,
  SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID,
  SECURENOW_SKU_METER_CAP_COLUMN,
} from "@/lib/marketing/securenow-public-commercial-packaging-copy";
import { SECURENOW_SKU_CARD_HEADING } from "@/lib/marketing/securenow-sku-card-copy";
import { SECURENOW_BETA_SKU_CONTENTS_QUOTE_HREF } from "@/lib/product-line/securenow-beta-sku-contents-copy";

import { SecureNowSkuCardView } from "./SecureNowSkuCardView";

describe("SecureNowSkuCardView", () => {
  it("renders buyer-safe SKU table, boundary, quote sequence anchor, and public quote link", () => {
    render(<SecureNowSkuCardView />);

    expect(screen.getByTestId("securenow-sku-card-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: SECURENOW_SKU_CARD_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: SECURENOW_SKU_METER_CAP_COLUMN })).toBeInTheDocument();
    expect(screen.getByTestId("securenow-sku-architecture-boundary")).toHaveTextContent(
      SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY,
    );
    expect(screen.getByTestId("securenow-public-quote-sequence-section")).toHaveAttribute(
      "id",
      SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID,
    );
    expect(screen.getByRole("link", { name: /view quote sequence on this card/i })).toHaveAttribute(
      "href",
      SECURENOW_BETA_SKU_CONTENTS_QUOTE_HREF,
    );
    expect(screen.getByText(/SN-EVAL/i)).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).toBeNull();
  });
});
