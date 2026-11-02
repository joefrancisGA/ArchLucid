import { describe, expect, it } from "vitest";

import {
  SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS,
  SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_LEAD,
} from "./securenow-first-useful-answer-home-copy";

describe("SecureNow first useful answer Home copy", () => {
  it("links one honest first-useful-answer row without recommending it first", () => {
    expect(SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_LEAD).toContain("NO_GO");
    expect(SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS).toHaveLength(1);
    expect(SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS[0]).toMatchObject({
      href: "/administration/securenow-first-hour#first-useful-answer",
      label: "Three visible facts",
    });
    expect(SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS[0]?.recommendedFirst).toBeUndefined();
  });
});
