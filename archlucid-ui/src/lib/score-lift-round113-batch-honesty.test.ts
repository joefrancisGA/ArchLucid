import { describe, expect, it } from "vitest";
import { RESOURCE_HUB_AUDIT_STORED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-audit-stored-empty-not-load-failure-copy";
import { RESOURCE_HUB_TERRAFORM_NOT_MAPPED_STORED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-terraform-not-mapped-stored-empty-not-load-failure-copy";
import { RESOURCE_HUB_OVERVIEW_AUDIT_UNAVAILABLE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-overview-audit-unavailable-not-load-failure-copy";
import { DIGESTS_BROWSE_SETUP_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/digests/digests-browse-setup-empty-not-load-failure-copy";

describe("score-lift round113 batch honesty", () => {
  it("hub audit, terraform, overview audit, digests setup", () => {
    expect(RESOURCE_HUB_AUDIT_STORED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_HUB_TERRAFORM_NOT_MAPPED_STORED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_HUB_OVERVIEW_AUDIT_UNAVAILABLE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(DIGESTS_BROWSE_SETUP_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
