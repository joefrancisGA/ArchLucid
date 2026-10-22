import { describe, expect, it } from "vitest";

import {
  ASSURANCE_STATUS_PUBLIC_LABEL,
  ASSURANCE_STATUS_PUBLIC_PATH,
  PRIVACY_POLICY_PUBLIC_LABEL,
  PRIVACY_POLICY_PUBLIC_PATH,
  TRUST_CENTER_PUBLIC_LABEL,
  TRUST_CENTER_PUBLIC_PATH,
} from "@/lib/marketing-assurance-public-labels";

describe("marketing-assurance-public-labels", () => {
  it("keeps canonical public chrome labels stable", () => {
    expect(TRUST_CENTER_PUBLIC_PATH).toBe("/trust");
    expect(TRUST_CENTER_PUBLIC_LABEL).toBe("Trust Center");
    expect(ASSURANCE_STATUS_PUBLIC_PATH).toBe("/assurance-status");
    expect(ASSURANCE_STATUS_PUBLIC_LABEL).toBe("Assurance status");
    expect(PRIVACY_POLICY_PUBLIC_PATH).toBe("/privacy");
    expect(PRIVACY_POLICY_PUBLIC_LABEL).toBe("Privacy policy");
  });
});
