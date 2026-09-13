import { describe, expect, it } from "vitest";

import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";

describe("errorRecoveryContractForScenario", () => {
  it("localizes connectivity and api-problem copy for SecureNow", () => {
    expect(errorRecoveryContractForScenario("connectivity", { productLineId: "security" }).whatFailed).toContain(
      "SecureNow",
    );
    expect(errorRecoveryContractForScenario("api-problem", { productLineId: "security" }).whatFailed).toContain(
      "SecureNow",
    );
  });

  it("defaults to ArchLucid copy for architecture product line", () => {
    expect(errorRecoveryContractForScenario("connectivity").whatFailed).toContain("ArchLucid");
    expect(errorRecoveryContractForScenario("api-problem").whatFailed).toContain("ArchLucid");
  });
});
