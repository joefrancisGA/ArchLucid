import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowPublishedListPriceSection } from "./SecureNowPublishedListPriceSection";
import { SECURENOW_PUBLISHED_LIST_PRICE_ROWS } from "@/lib/product-line/securenow-published-list-price-copy";

describe("SecureNowPublishedListPriceSection", () => {
  it("renders canonical SKU ids from published list price copy", () => {
    render(<SecureNowPublishedListPriceSection typography="operator" />);

    const section = screen.getByTestId("securenow-published-list-price");

    expect(section).toBeInTheDocument();

    for (const row of SECURENOW_PUBLISHED_LIST_PRICE_ROWS) {
      expect(section).toHaveTextContent(row.id);
    }
  });
});
