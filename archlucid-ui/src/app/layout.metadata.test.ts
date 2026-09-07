import { afterEach, describe, expect, it, vi } from "vitest";

import {
  productLineDocumentTitle,
  productLineTitleTemplate,
} from "@/lib/product-line/product-line-display-name";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

describe("root layout metadata helpers", () => {
  const originalProductEnv = process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT;

  afterEach(() => {
    if (originalProductEnv === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = originalProductEnv;
    }

    vi.resetModules();
  });

  it("builds Architecture title metadata from env", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "architecture";
    const productLine = resolveProductLineIdFromEnv();

    expect(productLineDocumentTitle(productLine)).toBe("ArchLucid workspace");
    expect(productLineTitleTemplate(productLine)).toBe("%s · ArchLucid");
  });

  it("builds Security title metadata from env", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "security";
    const productLine = resolveProductLineIdFromEnv();

    expect(productLineDocumentTitle(productLine)).toBe("SecureNow workspace");
    expect(productLineTitleTemplate(productLine)).toBe("%s · SecureNow");
  });
});
