import { describe, expect, it } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import {
  resolveColdSharedLinkEntrySignal,
  resolveColdSharedLinkUnpackPresentation,
} from "@/lib/cold-shared-link-unpack";

const readerPrincipal: CurrentPrincipal = {
  provenance: "auth-me",
  name: "Reader User",
  roleClaimValues: ["Reader"],
  primaryAppRole: "Reader",
  maxAuthority: "ReadAuthority",
  authorityRank: 1,
  hasEnterpriseOperatorSurfaces: false,
  hasCommittedArchitectureReview: false,
  hasRecognizedArchLucidRole: true,
  permissionClaimValues: [],
};

const workspaceStatus = {
  label: "Finalized",
  kind: "finalized" as const,
  statusTagKind: "ready" as const,
};

describe("cold-shared-link-unpack (TB-2181)", () => {
  it("detects readOnly and shared query entry signals", () => {
    expect(resolveColdSharedLinkEntrySignal(new URLSearchParams("readOnly=1"), false)).toBe("read_only_query");
    expect(resolveColdSharedLinkEntrySignal(new URLSearchParams("shared=1"), false)).toBe("shared_query");
    expect(resolveColdSharedLinkEntrySignal(new URLSearchParams(), true)).toBe("invitation_token");
    expect(resolveColdSharedLinkEntrySignal(new URLSearchParams(), false)).toBe("none");
  });

  it("returns null when no cold-open signal is present", () => {
    expect(
      resolveColdSharedLinkUnpackPresentation({
        runId: "run-1",
        packageTitle: "Claims intake",
        workspaceStatus,
        entrySignal: "none",
        principal: readerPrincipal,
      }),
    ).toBeNull();
  });

  it("returns role-shaped CTA for invitee readers on cold open", () => {
    const presentation = resolveColdSharedLinkUnpackPresentation({
      runId: "run-1",
      packageTitle: "Claims intake",
      workspaceStatus,
      entrySignal: "read_only_query",
      principal: readerPrincipal,
    });

    expect(presentation?.whyYouAreHere).toContain("read-only link");
    expect(presentation?.primaryCtaLabel).toBe("Review findings");
    expect(presentation?.primaryCtaHref).toContain("reviewTab=findings");
  });
});
