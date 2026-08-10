import { beforeEach, describe, expect, it, vi } from "vitest";

const authModeMock = vi.hoisted(() => ({ AUTH_MODE: "jwt" as string }));
const jwtModeMock = vi.hoisted(() => ({ isJwtAuthMode: vi.fn(() => true) }));
const signedInMock = vi.hoisted(() => ({ isLikelySignedIn: vi.fn(() => false) }));

vi.mock("@/lib/auth-config", () => authModeMock);
vi.mock("@/lib/oidc/config", () => jwtModeMock);
vi.mock("@/lib/oidc/session", () => signedInMock);

import { viewerCanStartReviewFromDemoExplain } from "@/lib/demo-explain-conversion-auth";

describe("demo-explain-conversion-auth (TB-1323)", () => {
  beforeEach(() => {
    authModeMock.AUTH_MODE = "jwt";
    jwtModeMock.isJwtAuthMode.mockReturnValue(true);
    signedInMock.isLikelySignedIn.mockReturnValue(false);
  });

  it("allows wizard entry in development-bypass mode", () => {
    authModeMock.AUTH_MODE = "development-bypass";

    expect(viewerCanStartReviewFromDemoExplain()).toBe(true);
  });

  it("requires a JWT session in jwt auth mode", () => {
    signedInMock.isLikelySignedIn.mockReturnValue(false);
    expect(viewerCanStartReviewFromDemoExplain()).toBe(false);

    signedInMock.isLikelySignedIn.mockReturnValue(true);
    expect(viewerCanStartReviewFromDemoExplain()).toBe(true);
  });
});
