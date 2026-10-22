import { describe, expect, it } from "vitest";

import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";
import { CLAIMS_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/claims-intake/definition";
import {
  decodeShowcaseRunId,
  hasCuratedShowcaseStaticPayload,
  isShowcaseStaticFirstRunId,
} from "./showcase-page-resolution";

describe("showcase-page-resolution", () => {
  it("treats claims-intake-modernization as a secondary sample slug, not static-first", () => {
    expect(isShowcaseStaticFirstRunId(CLAIMS_INTAKE_SAMPLE_RUN_ID)).toBe(false);
    expect(hasCuratedShowcaseStaticPayload(CLAIMS_INTAKE_SAMPLE_RUN_ID)).toBe(false);
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
