import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { getFoldedInternalRunbookEntry } from "@/lib/folded-internal-runbook-help";
import { HelpTopicAuthorityGate } from "./HelpTopicAuthorityGate";

const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuthMock.callerAuthorityRank,
    isAuthorityLoading: navAuthMock.isAuthorityLoading,
    currentPrincipal: { authorityRank: navAuthMock.callerAuthorityRank },
  }),
  useNavCallerAuthorityRank: () =>
    navAuthMock.isAuthorityLoading ? AUTHORITY_RANK.ReadAuthority : navAuthMock.callerAuthorityRank,
}));

describe("HelpTopicAuthorityGate", () => {
  const entry = getFoldedInternalRunbookEntry("first-value-20-minutes");

  it("blocks non-admin callers from internal-runbook topics", () => {
    expect(entry).not.toBeNull();
    navAuthMock.isAuthorityLoading = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    render(
      <HelpTopicAuthorityGate entry={entry!} denied={<div data-testid="denied">denied</div>}>
        <div data-testid="allowed">allowed</div>
      </HelpTopicAuthorityGate>,
    );

    expect(screen.getByTestId("denied")).toBeInTheDocument();
    expect(screen.queryByTestId("allowed")).not.toBeInTheDocument();
  });

  it("allows admin callers through internal-runbook topics", () => {
    expect(entry).not.toBeNull();
    navAuthMock.isAuthorityLoading = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(
      <HelpTopicAuthorityGate entry={entry!} denied={<div data-testid="denied">denied</div>}>
        <div data-testid="allowed">allowed</div>
      </HelpTopicAuthorityGate>,
    );

    expect(screen.getByTestId("allowed")).toBeInTheDocument();
    expect(screen.queryByTestId("denied")).not.toBeInTheDocument();
  });
});
