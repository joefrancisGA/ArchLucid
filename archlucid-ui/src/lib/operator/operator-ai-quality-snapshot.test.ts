import { describe, expect, it } from "vitest";

import {
  dispositionClass,
  dispositionLabel,
  type OperatorAiQualitySnapshotDisposition,
} from "@/lib/operator/operator-ai-quality-snapshot";

describe("operator-ai-quality-snapshot", () => {
  it("dispositionLabel_returns_known_labels_without_throwing", () => {
    expect(dispositionLabel("PASS")).toBe("PASS");
    expect(dispositionLabel("WARN")).toBe("WARN");
    expect(dispositionLabel("NOT_GENERATED")).toBe("Not generated");
  });

  it("disposition_helpers_do_not_throw_for_unknown_runtime_disposition", () => {
    const unknownDisposition = "BOGUS" as OperatorAiQualitySnapshotDisposition;

    expect(() => dispositionLabel(unknownDisposition)).not.toThrow();
    expect(() => dispositionClass(unknownDisposition)).not.toThrow();
    expect(dispositionLabel(unknownDisposition)).toBe("BOGUS");
  });
});
