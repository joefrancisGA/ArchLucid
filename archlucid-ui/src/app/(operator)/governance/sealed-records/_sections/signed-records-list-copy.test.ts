import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  formatSignedRecordsListPaginationSummary,
  formatSignedRecordsListRecordCount,
} from "./signed-records-list-copy";

describe("signed-records-list-copy", () => {
  it("keeps Browse reviews scope-neutral without projectId=default (TB-1942)", () => {
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL).toBe("Browse reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).toBe("/architecture/reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/projectId=/i);
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/default/i);
  });

  it("formats pagination summary with more-available honesty (TB-1944)", () => {
    expect(formatSignedRecordsListPaginationSummary(1, 100, true)).toMatch(/Page 1 · Showing 100 sealed records · more available/);
    expect(formatSignedRecordsListPaginationSummary(2, 1, false)).toBe("Page 2 · Showing 1 sealed record");
  });

  it("formats page-scoped record counts without implying workspace totals", () => {
    expect(formatSignedRecordsListRecordCount(12, { page: 1, hasMore: true })).toBe(
      "12 sealed review records on this page · more available",
    );
    expect(formatSignedRecordsListRecordCount(1, { page: 2, hasMore: false })).toBe(
      "1 sealed review record on this page",
    );
  });
});
