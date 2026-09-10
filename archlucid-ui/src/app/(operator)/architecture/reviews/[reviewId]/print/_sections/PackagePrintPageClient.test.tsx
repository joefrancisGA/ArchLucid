import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PackagePrintPageClient } from "@/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient";
import { SESSION_LAST_ACTIVITY_STORAGE_KEY } from "@/lib/auth/session-idle-timeout";

const ensureAccessTokenFreshMock = vi.hoisted(() => vi.fn(async () => undefined));

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

vi.mock("@/lib/oidc/session", () => ({
  ensureAccessTokenFresh: ensureAccessTokenFreshMock,
}));

describe("PackagePrintPageClient (LI-14)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    ensureAccessTokenFreshMock.mockClear();
  });

  it("writes shared session activity on mount for cross-tab idle keep-alive", () => {
    render(<PackagePrintPageClient runId="run-print-1" />);

    expect(window.localStorage.getItem(SESSION_LAST_ACTIVITY_STORAGE_KEY)).not.toBeNull();
    expect(ensureAccessTokenFreshMock).toHaveBeenCalled();
  });
});
