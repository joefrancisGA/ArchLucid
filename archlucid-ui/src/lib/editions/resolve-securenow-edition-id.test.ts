import { afterEach, describe, expect, it } from "vitest";

import { lockProductLineForSecureNowEdition } from "@/lib/editions/lock-product-line-for-securenow-edition";
import { resolveSecureNowEditionId } from "@/lib/editions/resolve-securenow-edition-id";
import {
  secureNowEditionLocksProductLine,
  type SecureNowEditionId,
} from "@/lib/editions/securenow-edition-id";
import {
  resolveSecureNowWorkspaceDocumentTitle,
  resolveSecureNowWorkspaceTitleTemplate,
} from "@/lib/editions/securenow-edition-document-title";
import { PRODUCT_LINE_COOKIE } from "@/lib/product-line/product-line-storage";
import { resolveProductLineId } from "@/lib/product-line/resolve-product-line-id";

describe("resolveSecureNowEditionId", () => {
  afterEach(() => {
    document.cookie = `${PRODUCT_LINE_COOKIE}=; Max-Age=0; Path=/`;
    delete process.env.NEXT_PUBLIC_SECURENOW_EDITION;
    delete process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT;
  });

  it("returns generic when the edition env is missing or unknown", () => {
    delete process.env.NEXT_PUBLIC_SECURENOW_EDITION;

    expect(resolveSecureNowEditionId()).toBe("generic");
    expect(resolveSecureNowEditionId(null)).toBe("generic");
    expect(resolveSecureNowEditionId("")).toBe("generic");
    expect(resolveSecureNowEditionId("other")).toBe("generic");
  });

  it("accepts uhg with surrounding case and whitespace", () => {
    expect(resolveSecureNowEditionId("uhg")).toBe("uhg");
    expect(resolveSecureNowEditionId("UHG ")).toBe("uhg");
    expect(resolveSecureNowEditionId(" Generic")).toBe("generic");
  });

  it("locks the product line to SecureNow when the edition is uhg", () => {
    process.env.NEXT_PUBLIC_SECURENOW_EDITION = "uhg";
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "architecture";
    document.cookie = `${PRODUCT_LINE_COOKIE}=architecture; Path=/`;

    expect(lockProductLineForSecureNowEdition("architecture")).toBe("security");
    expect(resolveProductLineId()).toBe("security");
  });

  it("keeps the architecture cookie when the edition is generic", () => {
    process.env.NEXT_PUBLIC_SECURENOW_EDITION = "generic";
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "security";
    document.cookie = `${PRODUCT_LINE_COOKIE}=architecture; Path=/`;

    expect(lockProductLineForSecureNowEdition("architecture")).toBe("architecture");
    expect(resolveProductLineId()).toBe("architecture");
  });

  it("names the UHG workspace in the browser title and leaves generic titles unchanged", () => {
    expect(resolveSecureNowWorkspaceDocumentTitle("security")).toBe("SecureNow workspace");
    expect(resolveSecureNowWorkspaceTitleTemplate("security")).toBe("%s · SecureNow");

    process.env.NEXT_PUBLIC_SECURENOW_EDITION = "uhg";

    expect(resolveSecureNowWorkspaceDocumentTitle("security")).toBe("SecureNow UHG workspace");
    expect(resolveSecureNowWorkspaceTitleTemplate("security")).toBe("%s · SecureNow UHG");
  });

  it("handles every edition in the product-line lock switch", () => {
    const editions: readonly SecureNowEditionId[] = ["generic", "uhg"];

    expect(editions.map((edition) => secureNowEditionLocksProductLine(edition))).toEqual([false, true]);
  });
});
