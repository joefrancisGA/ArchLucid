import { describe, expect, it } from "vitest";

import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";
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

  it("treats customer-intake-modernization as static-first", () => {
    expect(isShowcaseStaticFirstRunId(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(true);
    expect(hasCuratedShowcaseStaticPayload(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(true);
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
