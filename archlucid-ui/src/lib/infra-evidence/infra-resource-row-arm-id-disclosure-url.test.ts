import { describe, expect, it, vi } from "vitest";

import {
  infraResourceRowArmIdDisclosureHrefFromSearch,
  parseInfraResourceRowArmIdDisclosureKeyFromSearch,
  writeInfraResourceRowArmIdDisclosureKeyToUrl,
} from "@/lib/infra-evidence/infra-resource-row-arm-id-disclosure-url";

describe("infra-resource-row-arm-id-disclosure-url", () => {
  it("parses disclosure keys from search params", () => {
    expect(parseInfraResourceRowArmIdDisclosureKeyFromSearch(null)).toBe("");
    expect(parseInfraResourceRowArmIdDisclosureKeyFromSearch("res-uuid-1")).toBe("res-uuid-1");
    expect(parseInfraResourceRowArmIdDisclosureKeyFromSearch(" res-uuid-1 ")).toBe("res-uuid-1");
  });

  it("builds disclosure hrefs from current search", () => {
    expect(
      infraResourceRowArmIdDisclosureHrefFromSearch(
        "workQueue=drift",
        "res-uuid-1",
        "/governance/infrastructure/resources",
      ),
    ).toBe("/governance/infrastructure/resources?workQueue=drift&infraResourceRowArmIdDisclosureKey=res-uuid-1");
    expect(
      infraResourceRowArmIdDisclosureHrefFromSearch(
        "workQueue=drift&infraResourceRowArmIdDisclosureKey=res-uuid-1",
        null,
        "/governance/infrastructure/resources",
      ),
    ).toBe("/governance/infrastructure/resources?workQueue=drift");
  });

  it("writes disclosure keys to the URL without a Next.js soft navigation", () => {
    window.history.replaceState(
      {},
      "",
      "/governance/infrastructure/resources?workQueue=drift",
    );
    const replaceState = vi.spyOn(window.history, "replaceState");

    writeInfraResourceRowArmIdDisclosureKeyToUrl("f220b036-1531-4e08-940a-11bcadcff4d1");

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/governance/infrastructure/resources?workQueue=drift&infraResourceRowArmIdDisclosureKey=f220b036-1531-4e08-940a-11bcadcff4d1",
    );

    writeInfraResourceRowArmIdDisclosureKeyToUrl(null);

    expect(replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/governance/infrastructure/resources?workQueue=drift",
    );
  });
});
