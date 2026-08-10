import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
} from "./signed-records-list-copy";

describe("signed-records-list-copy", () => {
  it("keeps Browse reviews scope-neutral without projectId=default (TB-1942)", () => {
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL).toBe("Browse reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).toBe("/architecture/reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/projectId=/i);
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/default/i);
  });
});
