import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_APPROVAL_QUEUE_BUYER_OVERVIEW,
  GOVERNANCE_APPROVAL_QUEUE_BUYER_START_HERE_HELPER,
  GOVERNANCE_APPROVAL_QUEUE_PAGE_LEAD,
} from "@/lib/approval-queue-evidence-copy";

describe("approval-queue-evidence-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(GOVERNANCE_APPROVAL_QUEUE_BUYER_OVERVIEW).not.toBe(GOVERNANCE_APPROVAL_QUEUE_PAGE_LEAD);
    expect(GOVERNANCE_APPROVAL_QUEUE_BUYER_OVERVIEW).not.toBe(GOVERNANCE_APPROVAL_QUEUE_BUYER_START_HERE_HELPER);
  });
});
