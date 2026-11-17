import { describe, expect, it } from "vitest";

import { SECURENOW_SAMPLE_FIXTURE_PATH_ID } from "@/lib/marketing/securenow-sample-copy";
import {
  PUBLIC_SAMPLE_REVIEW_HREF,
  PUBLIC_SAMPLE_REVIEW_LABEL,
  PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF,
  PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL,
} from "@/lib/marketing/public-sample-entry-links";
import { SECURENOW_SAMPLE_MARKETING_PATH } from "@/lib/product-line/securenow-marketing-route-policy";
import { CUSTOMER_INTAKE_CANONICAL_PROOF_HREF } from "@/lib/samples/customer-intake-modernization/definition";

describe("public sample entry links", () => {
  it("uses the existing sample review and the public fixture-path-01 page", () => {
    expect(PUBLIC_SAMPLE_REVIEW_HREF).toBe(CUSTOMER_INTAKE_CANONICAL_PROOF_HREF);
    expect(PUBLIC_SAMPLE_REVIEW_HREF).toBe("/showcase/customer-intake-modernization");
    expect(PUBLIC_SAMPLE_REVIEW_LABEL).toBe("Healthcare Claims sample review");
    expect(PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF).toBe(SECURENOW_SAMPLE_MARKETING_PATH);
    expect(PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF).toBe("/securenow-sample");
    expect(PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL).toBe(
      `SecureNow sample (${SECURENOW_SAMPLE_FIXTURE_PATH_ID})`,
    );
    expect(PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL).toContain("fixture-path-01");
    expect(PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL).not.toMatch(/\$/);
    expect(PUBLIC_SAMPLE_REVIEW_HREF).not.toBe("/why-securenow");
    expect(PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF).not.toBe("/why-securenow");
  });
});
