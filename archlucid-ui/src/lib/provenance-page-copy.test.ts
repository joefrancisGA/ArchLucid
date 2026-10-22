import { describe, expect, it } from "vitest";

import {
  PROVENANCE_BUYER_OVERVIEW,
  PROVENANCE_BUYER_START_HERE_HELPER,
  PROVENANCE_PAGE_LEAD,
} from "@/lib/provenance-page-copy";

describe("provenance-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(PROVENANCE_BUYER_OVERVIEW).not.toBe(PROVENANCE_PAGE_LEAD);
    expect(PROVENANCE_BUYER_OVERVIEW).not.toBe(PROVENANCE_BUYER_START_HERE_HELPER);
  });
});
