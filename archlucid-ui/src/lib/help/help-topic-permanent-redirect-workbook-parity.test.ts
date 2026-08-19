import { describe, expect, it } from "vitest";

import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help/help-topic-permanent-redirects";

describe("help-topic-permanent-redirect workbook parity (Batch T)", () => {
  it("has no help topic permanent redirects to mirror in workbook migrations", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS).toEqual({});
  });
});
