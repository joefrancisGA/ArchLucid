import { describe, expect, it, vi } from "vitest";

import {
  BUYER_DEMO_DECISION_DATE_NOT_STORED,
  buyerDemoPackageCardMeta,
} from "@/lib/buyer/buyer-demo-package-card-meta";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

describe("buyerDemoPackageCardMeta", () => {
  it("does not fabricate a decision date when demo metadata omits one", () => {
    const meta = buyerDemoPackageCardMeta("claims-intake-in-progress-003");

    expect(meta?.decisionDate).toBe(BUYER_DEMO_DECISION_DATE_NOT_STORED);
    expect(meta?.riskOwner).toBe("Risk owner was not stored.");
    expect(meta?.packageOwner).toBe("Package owner was not stored.");
  });

  it("keeps scripted calendar decision dates on approved demo cards", () => {
    const meta = buyerDemoPackageCardMeta(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(meta?.decisionDate).toBe("Jan 14, 2026");
  });
});
