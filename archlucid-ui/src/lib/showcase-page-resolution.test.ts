import { describe, expect, it } from "vitest";

import {
  decodeShowcaseRunId,
  hasCuratedShowcaseStaticPayload,
  isShowcaseStaticFirstRunId,
} from "./showcase-page-resolution";

describe("showcase-page-resolution", () => {
  it("treats claims-intake-modernization as static-first", () => {
    expect(isShowcaseStaticFirstRunId("claims-intake-modernization")).toBe(true);
    expect(hasCuratedShowcaseStaticPayload("claims-intake-modernization")).toBe(true);
  });

  it("does not treat unknown showcase slugs as static-first", () => {
    expect(isShowcaseStaticFirstRunId("contoso-unknown-slug")).toBe(false);
    expect(hasCuratedShowcaseStaticPayload("contoso-unknown-slug")).toBe(false);
  });

  it("decodes encoded run ids", () => {
    expect(decodeShowcaseRunId(encodeURIComponent("claims-intake-modernization"))).toBe(
      "claims-intake-modernization",
    );
  });
});
