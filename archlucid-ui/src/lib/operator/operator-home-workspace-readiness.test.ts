import { describe, expect, it, vi } from "vitest";

import {
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_HEALTH_BLOCKER,
} from "@/lib/buyer/buyer-polish-copy";
import { resolveOperatorHomeWorkspaceReadiness } from "@/lib/operator/operator-home-workspace-readiness";

vi.mock("@/lib/finish-setup-deployment", () => ({
  isSelfHostedDeploymentEnv: vi.fn(() => false),
}));

import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";

describe("resolveOperatorHomeWorkspaceReadiness", () => {
  it("allows begin when admin is assigned on managed SaaS", () => {
    expect(
      resolveOperatorHomeWorkspaceReadiness({
        healthReady: false,
        healthLoadFailed: true,
        principalAdmin: true,
      }),
    ).toEqual({
      canBegin: true,
      blockerMessage: null,
    });
  });

  it("blocks when no workspace administrator is assigned", () => {
    expect(
      resolveOperatorHomeWorkspaceReadiness({
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      }),
    ).toEqual({
      canBegin: false,
      blockerMessage: OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    });
  });

  it("blocks self-hosted tenants until platform health is confirmed", () => {
    vi.mocked(isSelfHostedDeploymentEnv).mockReturnValue(true);

    expect(
      resolveOperatorHomeWorkspaceReadiness({
        healthReady: false,
        healthLoadFailed: true,
        principalAdmin: true,
      }),
    ).toEqual({
      canBegin: false,
      blockerMessage: OPERATOR_HOME_HEALTH_BLOCKER,
    });
  });
});
