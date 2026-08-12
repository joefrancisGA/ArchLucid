import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  formatSignedRecordsListPaginationSummary,
} from "./signed-records-list-copy";

describe("signed-records-list-copy", () => {
  it("keeps Browse reviews scope-neutral without projectId=default (TB-1942)", () => {
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL).toBe("Browse reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).toBe("/architecture/reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/projectId=/i);
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/default/i);
  });

  it("formats pagination summary with more-available honesty (TB-1944)", () => {
    expect(formatSignedRecordsListPaginationSummary(1, 100, true)).toMatch(/Page 1 · Showing 100 signed records · more available/);
    expect(formatSignedRecordsListPaginationSummary(2, 1, false)).toBe("Page 2 · Showing 1 signed record");
  });
});
