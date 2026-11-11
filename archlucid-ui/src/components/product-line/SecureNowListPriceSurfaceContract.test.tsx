import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowQuotePacketPageView } from "@/app/(operator)/administration/securenow-quote-packet/SecureNowQuotePacketPageView";
import { SecureNowSkuCardView } from "@/app/(marketing)/securenow-sku/SecureNowSkuCardView";
import { SECURENOW_SKU_CARD_ROWS } from "@/lib/marketing/securenow-sku-card-copy";
import { SECURENOW_PUBLISHED_LIST_PRICE_ROWS } from "@/lib/product-line/securenow-published-list-price-copy";

function firstColumnValues(table: HTMLElement): string[] {
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent?.trim() ?? "");
}

describe("SecureNow list-price surface contract", () => {
  it("keeps public SKU identifiers and quote packet list-price rows aligned", () => {
    render(
      <>
        <SecureNowSkuCardView />
        <SecureNowQuotePacketPageView />
      </>,
    );

    const canonicalIds = SECURENOW_PUBLISHED_LIST_PRICE_ROWS.map((row) => row.id);
    const publicSkuIds = SECURENOW_SKU_CARD_ROWS.map(([sku]) => sku);

    expect(
      firstColumnValues(screen.getByRole("table", { name: "SecureNow SKU identifiers and meters" })),
    ).toEqual(publicSkuIds);

    const publishedListPriceTables = screen.getAllByRole("table", { name: "SecureNow published list prices" });

    expect(publishedListPriceTables).toHaveLength(2);
    expect(publishedListPriceTables.map(firstColumnValues)).toEqual([canonicalIds, canonicalIds]);
  });
});
