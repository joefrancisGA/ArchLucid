import { describe, expect, it } from "vitest";

import { DRIFT_TERRAFORM_EXPORT_RECEIPT_ADVISORY_LINE } from "@/lib/infra-evidence/drift-terraform-export-receipt-advisory-copy";
import { formatCloudConnectionsReturnLinkLabel } from "@/lib/integrations/cloud-connections-return-path-honesty-copy";

describe("score-lift round59 batch honesty", () => {
  it("return path labels and drift export receipt", () => {
    expect(formatCloudConnectionsReturnLinkLabel("/governance/remediation-factory")).toContain("remediation factory");
    expect(DRIFT_TERRAFORM_EXPORT_RECEIPT_ADVISORY_LINE).toContain("advisory");
    expect(DRIFT_TERRAFORM_EXPORT_RECEIPT_ADVISORY_LINE).toContain("not proof");
  });
});