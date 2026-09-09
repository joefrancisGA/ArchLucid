import { describe, expect, it } from "vitest";

import {
  APPROVAL_LINEAGE_BUYER_OVERVIEW,
  APPROVAL_LINEAGE_BUYER_START_HERE_HELPER,
  APPROVAL_LINEAGE_PAGE_LEAD,
} from "@/lib/approval-lineage-evidence-copy";

describe("approval-lineage-evidence-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(APPROVAL_LINEAGE_BUYER_OVERVIEW).not.toBe(APPROVAL_LINEAGE_PAGE_LEAD);
    expect(APPROVAL_LINEAGE_BUYER_OVERVIEW).not.toBe(APPROVAL_LINEAGE_BUYER_START_HERE_HELPER);
  });
});
