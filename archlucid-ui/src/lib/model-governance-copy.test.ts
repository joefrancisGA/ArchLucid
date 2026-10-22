import { describe, expect, it } from "vitest";

import {
  MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY,
  MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY,
  modelGovernanceLoadBlockedMessage,
} from "@/lib/model-governance-copy";

describe("model-governance-copy", () => {
  it("maps auth failures to admin-required copy without authority enum leakage (TB-1926)", () => {
    expect(modelGovernanceLoadBlockedMessage(401)).toBe(MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY);
    expect(modelGovernanceLoadBlockedMessage(403)).toBe(MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY);
    expect(MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY).not.toMatch(/AdminAuthority/i);
  });

  it("maps other HTTP statuses to generic unavailable copy without status codes (TB-1926)", () => {
    expect(modelGovernanceLoadBlockedMessage(500)).toBe(MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY);
    expect(modelGovernanceLoadBlockedMessage(503)).toBe(MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY);
    expect(MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY).not.toMatch(/HTTP\s*\d+/i);
  });
});
