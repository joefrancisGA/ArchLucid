import { afterEach, describe, expect, it, vi } from "vitest";

import {
  productLineDocumentTitle,
  productLineRootManifestPath,
  productLineRootMetadataIcons,
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
    expect(productLineRootMetadataIcons(productLine)).toEqual({
      icon: [{ url: "/logo/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/logo/icon-192.png", sizes: "192x192", type: "image/png" }],
    });
    expect(productLineRootManifestPath(productLine)).toBe("/manifest.webmanifest");
  });

  it("builds Security title metadata from env", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "security";
    const productLine = resolveProductLineIdFromEnv();

    expect(productLineDocumentTitle(productLine)).toBe("SecureNow workspace");
    expect(productLineTitleTemplate(productLine)).toBe("%s · SecureNow");
    expect(productLineRootMetadataIcons(productLine)).toBeUndefined();
    expect(productLineRootManifestPath(productLine)).toBeUndefined();
  });
});
