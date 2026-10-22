import { afterEach, describe, expect, it } from "vitest";

import {
  PRODUCT_LINE_COOKIE,
  readProductLineCookie,
} from "@/lib/product-line/product-line-storage";

describe("product-line storage", () => {
  afterEach(() => {
    document.cookie = `${PRODUCT_LINE_COOKIE}=; Max-Age=0; Path=/`;
  });

  it("returns null instead of throwing for malformed percent-encoded cookies", () => {
    document.cookie = `${PRODUCT_LINE_COOKIE}=%E0%A4%A; Path=/`;

    expect(() => readProductLineCookie()).not.toThrow();
    expect(readProductLineCookie()).toBeNull();
  });
});
