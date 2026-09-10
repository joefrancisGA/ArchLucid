import { describe, expect, it } from "vitest";

import {
  resolveAuthBetaReadinessInviteBlockers,
  type AdminAuthConfigurationDiagnosticsResponse,
} from "@/lib/auth/auth-beta-readiness-invite-blockers";

function diagnostics(
  partial: Partial<AdminAuthConfigurationDiagnosticsResponse>,
): AdminAuthConfigurationDiagnosticsResponse {
  return {
    authMode: "JwtBearer",
    operatorBaseUrlConfigured: true,
    localTrialIdentityConfigured: true,
    audienceConfigured: true,
    roleClaimNameConfigured: true,
    ...partial,
  };
}

describe("resolveAuthBetaReadinessInviteBlockers (TB-928)", () => {
  it("returns no blockers when invite diagnostics are configured", () => {
    expect(resolveAuthBetaReadinessInviteBlockers(diagnostics({}))).toEqual([]);
  });

  it("flags missing operator base URL and invite session signing", () => {
    const blockers = resolveAuthBetaReadinessInviteBlockers(
      diagnostics({
        operatorBaseUrlConfigured: false,
        localTrialIdentityConfigured: false,
      }),
    );

    expect(blockers.map((blocker) => blocker.id)).toEqual(["operator-base-url", "invite-session-signing"]);
  });
});
