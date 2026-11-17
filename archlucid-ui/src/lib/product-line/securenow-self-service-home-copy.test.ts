import { describe, expect, it } from "vitest";

import {
  SECURENOW_SELF_SERVICE_HOME_ROWS,
  SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING,
  SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD,
  SECURENOW_SELF_SERVICE_OPERATOR_PATH,
} from "@/lib/product-line/securenow-self-service-home-copy";

describe("SecureNow self-service home copy", () => {
  it("defines the stuck-state checks section without a recommended-first row", () => {
    expect(SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING).toBe("When you are stuck");
    expect(SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD).toMatch(/NO_GO/);
    expect(SECURENOW_SELF_SERVICE_HOME_ROWS).toHaveLength(4);
    expect(SECURENOW_SELF_SERVICE_HOME_ROWS.map((row) => row.href)).toEqual([
      `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#collection`,
      `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#connector`,
      `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#ranking`,
      `${SECURENOW_SELF_SERVICE_OPERATOR_PATH}#email`,
    ]);
    expect(SECURENOW_SELF_SERVICE_HOME_ROWS.every((row) => row.recommendedFirst === undefined)).toBe(true);
  });

  it("avoids buy CTAs and dollar amounts", () => {
    const copy = [
      SECURENOW_SELF_SERVICE_HOME_SECTION_HEADING,
      SECURENOW_SELF_SERVICE_HOME_SECTION_LEAD,
      ...SECURENOW_SELF_SERVICE_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(copy).not.toMatch(/\$/);
    expect(copy).not.toMatch(/Start trial/i);
  });
});
