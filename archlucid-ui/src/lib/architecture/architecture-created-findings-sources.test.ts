import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_CREATED_FINDINGS_BUYER_OVERVIEW,
  ARCHITECTURE_CREATED_FINDINGS_BUYER_START_HERE_HELPER,
  ARCHITECTURE_CREATED_FINDINGS_PAGE_LEAD,
} from "@/lib/architecture/architecture-created-findings-sources";

describe("architecture-created-findings-sources", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(ARCHITECTURE_CREATED_FINDINGS_BUYER_OVERVIEW).not.toBe(ARCHITECTURE_CREATED_FINDINGS_PAGE_LEAD);
    expect(ARCHITECTURE_CREATED_FINDINGS_BUYER_OVERVIEW).not.toBe(ARCHITECTURE_CREATED_FINDINGS_BUYER_START_HERE_HELPER);
  });
});
