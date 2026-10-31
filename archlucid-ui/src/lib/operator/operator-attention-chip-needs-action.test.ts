import { describe, expect, it } from "vitest";

import {
  formatOperatorAttentionChipAriaLabel,
  operatorAttentionChipNeedsAction,
  resolveHighestNonZeroAttentionKind,
  resolveOperatorAttentionChipCount,
} from "@/lib/operator/operator-attention-chip-needs-action";
import { OPERATOR_ATTENTION_KIND_IDS } from "@/lib/operator/operator-attention-taxonomy";

describe("operator attention chip helpers", () => {
  it("normalizes non-finite chip counts to zero for display and aria", () => {
    expect(resolveOperatorAttentionChipCount(Number.NaN)).toBe(0);
    expect(formatOperatorAttentionChipAriaLabel("Alerts", Number.NaN)).toBe("Alerts: 0 items");
    expect(operatorAttentionChipNeedsAction(Number.NaN)).toBe(false);
  });

  it("ignores non-finite counts when resolving the highest attention kind", () => {
    const counts = Object.fromEntries(
      OPERATOR_ATTENTION_KIND_IDS.map((kind) => [kind, kind === "alerts" ? Number.NaN : 0]),
    ) as Partial<Record<(typeof OPERATOR_ATTENTION_KIND_IDS)[number], number>>;

    expect(resolveHighestNonZeroAttentionKind(counts, OPERATOR_ATTENTION_KIND_IDS)).toBeNull();
  });
});
