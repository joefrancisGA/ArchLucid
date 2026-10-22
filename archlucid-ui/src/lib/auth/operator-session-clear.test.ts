import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { markEmailOtpResendSent, readEmailOtpResendCooldown } from "@/lib/auth/email-otp-resend";
import { clearOperatorSessionForExpiry } from "@/lib/auth/operator-session-clear";
import {
  readEmailOtpChallengeSession,
  readInvitationToken,
  storeEmailOtpChallengeSession,
  storeInvitationToken,
} from "@/lib/auth/email-otp-session";

vi.mock("@/lib/oidc/session", () => ({
  clearOidcSession: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  clearOperatorScopeStorage: vi.fn(),
}));

vi.mock("@/lib/auth/idle-desk-restore", () => ({
  persistIdleDeskRestoreBeforeSessionClear: vi.fn(),
}));

vi.mock("@/lib/navigation/auth-sign-in-href", () => ({
  buildSessionExpiredHref: (path: string) => `/auth/session-expired?returnPath=${encodeURIComponent(path)}`,
}));

const push = vi.fn();
const refresh = vi.fn();

const router = {
  push,
  refresh,
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  replace: vi.fn(),
};

describe("clearOperatorSessionForExpiry", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();

    vi.stubGlobal("sessionStorage", {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
      removeItem(key: string) {
        this.store.delete(key);
      },
      clear() {
        this.store.clear();
      },
    });

    const storage = sessionStorage as unknown as Storage;

    vi.stubGlobal("window", {
      location: { pathname: "/architecture/reviews", search: "?run=1" },
      sessionStorage: storage,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not clear email OTP or invitation sessionStorage (operator expiry clears OIDC/scope only)", () => {
    const now = 1_700_000_000_000;
    storeEmailOtpChallengeSession("ch-1", "o***@example.com", "o@example.com");
    markEmailOtpResendSent(now);
    storeInvitationToken("invite-token");

    clearOperatorSessionForExpiry(router);

    expect(readInvitationToken()).toBe("invite-token");
    expect(readEmailOtpChallengeSession()?.challengeId).toBe("ch-1");
    expect(readEmailOtpResendCooldown(now + 1_000).active).toBe(true);
    expect(push).toHaveBeenCalled();
  });
});
