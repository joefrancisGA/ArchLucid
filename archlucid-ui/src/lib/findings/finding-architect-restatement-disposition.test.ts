import { describe, expect, it } from "vitest";

describe("finding architect restatement disposition payload (LP-15)", () => {
  it("keeps architect restatement separate from rationale on disposition submit", () => {
    const rationale = "Accepted after control review.";
    const architectRestatement = "We will tell the ARB that replication lag is accepted with monitoring.";

    const body = {
      disposition: "Accepted" as const,
      rationale,
      architectRestatement,
      runId: "run-001",
      tradeOffAcknowledgment: "accepting replication latency trade-off",
    };

    expect(body.rationale).not.toContain(architectRestatement);
    expect(body.architectRestatement).not.toContain(rationale);
  });

  it("does not expose a sealed finding message patch field", () => {
    const dispositionBodyKeys = [
      "disposition",
      "rationale",
      "architectRestatement",
      "runId",
      "tradeOffAcknowledgment",
      "revisitDueUtc",
      "evidenceRequestText",
      "impactPreviewCompleted",
      "previewOverrideReason",
      "expectedCurrentDispositionRowVersionBase64",
    ];

    expect(dispositionBodyKeys).not.toContain("message");
    expect(dispositionBodyKeys).not.toContain("title");
  });
});
