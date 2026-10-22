import { describe, expect, it } from "vitest";

import { GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH } from "@/lib/governance/governance-route-paths";

import {
  OPERATOR_ATTENTION_KIND_DESTINATIONS,
  OPERATOR_NEEDS_ATTENTION_INBOX_HREF,
} from "./operator-attention-kind-destinations";

describe("OPERATOR_ATTENTION_KIND_DESTINATIONS", () => {
  it("describes awaiting-approval as reviews waiting for approval", () => {
    expect(OPERATOR_ATTENTION_KIND_DESTINATIONS["awaiting-approval"].description).toBe(
      "Reviews waiting for approval.",
    );
  });

  it("points the needs-attention inbox at the canonical governance path", () => {
    expect(OPERATOR_NEEDS_ATTENTION_INBOX_HREF).toBe(GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH);
  });
});
