import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PackagePrintPageClient } from "@/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient";
import { SESSION_LAST_ACTIVITY_STORAGE_KEY } from "@/lib/auth/session-idle-timeout";
import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import * as oidcSession from "@/lib/oidc/session";

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: () => ({
    isPending: true,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-ask-run-coverage-honesty-query", () => ({
  useAskRunCoverageHonestyQuery: () => ({
    data: undefined,
  }),
}));

vi.mock("@/hooks/use-package-print-meeting-capture-query", () => ({
  usePackagePrintMeetingCaptureQuery: () => ({
    data: undefined,
  }),
}));

describe("PackagePrintPageClient (LI-14)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(oidcSession, "ensureAccessTokenFresh").mockResolvedValue(undefined);
    vi.spyOn(bffSessionSync, "pulseBffSessionActivity").mockResolvedValue("ok");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes shared session activity on mount for cross-tab idle keep-alive", async () => {
    render(<PackagePrintPageClient runId="run-print-1" />);

    expect(window.localStorage.getItem(SESSION_LAST_ACTIVITY_STORAGE_KEY)).not.toBeNull();
    await waitFor(() => {
      expect(oidcSession.ensureAccessTokenFresh).toHaveBeenCalled();
    });
  });
});
