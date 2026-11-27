import { describe, expect, it } from "vitest";

import {
  SECURENOW_MARKETABILITY_BUYER_PATH_LEAD,
  SECURENOW_MARKETABILITY_NOT_PUBLIC_OFFER_LINE,
  SECURENOW_MARKETABILITY_SN_EVAL_QUOTE_LINE,
} from "@/lib/product-line/securenow-marketability-buyer-path-copy";

describe("score lift round153 wave H5 honesty", () => {
  it("names NO_GO, signed quote, and denies checkout or public GO", () => {
    expect(SECURENOW_MARKETABILITY_BUYER_PATH_LEAD).toContain("NO_GO");
    expect(SECURENOW_MARKETABILITY_SN_EVAL_QUOTE_LINE).toContain("signed quote");
    expect(SECURENOW_MARKETABILITY_NOT_PUBLIC_OFFER_LINE).toContain("not a public GO");
  });
});
