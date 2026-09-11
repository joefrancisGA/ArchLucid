import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_BODY,
  ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_TITLE,
  ARCHITECTURE_DRAFT_WORK_LEASE_LOST_BODY,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_BODY,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_TITLE,
} from "@/lib/architecture/architecture-draft-work-lease-copy";

describe("architecture-draft-work-lease-copy (LW-091 / LW-092)", () => {
  it("describes lease honesty without live presence language", () => {
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_TITLE.toLowerCase()).not.toContain("online");
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_BODY).toContain("not live presence");
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_BODY).toContain("conflict");
  });

  it("steal confirm copy warns about no merge and audit", () => {
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_TITLE).toContain("Take over");
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_BODY).toContain("audited");
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_BODY).toContain("conflict");
  });

  it("lease lost copy tells the operator to refresh before saving", () => {
    expect(ARCHITECTURE_DRAFT_WORK_LEASE_LOST_BODY).toContain("Refresh");
  });
});
