import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SECURENOW_EDITION_ID,
  isSecureNowEditionId,
} from "@/lib/product-line/securenow-edition-id";
import {
  resolveSecureNowEditionIdFromEnv,
  SECURENOW_EDITION_ENV_NAME,
} from "@/lib/product-line/resolve-securenow-edition-id";
import { resolveProductLineId } from "@/lib/product-line/resolve-product-line-id";

describe("SecureNow edition resolution", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults missing configuration to generic", () => {
    expect(resolveSecureNowEditionIdFromEnv()).toBe(DEFAULT_SECURENOW_EDITION_ID);
  });

  it("normalizes the configured edition", () => {
    vi.stubEnv(SECURENOW_EDITION_ENV_NAME, " UHG ");

    expect(resolveSecureNowEditionIdFromEnv()).toBe("uhg");
  });

  it("rejects unknown editions", () => {
    vi.stubEnv(SECURENOW_EDITION_ENV_NAME, "enterprise");

    expect(resolveSecureNowEditionIdFromEnv()).toBe("generic");
    expect(isSecureNowEditionId("enterprise")).toBe(false);
  });

  it("locks UHG deployments to SecureNow despite a product-line cookie", () => {
    vi.stubEnv(SECURENOW_EDITION_ENV_NAME, "uhg");
    document.cookie = "archlucid_product_line_v1=architecture; Path=/";

    expect(resolveProductLineId()).toBe("security");
  });
});
