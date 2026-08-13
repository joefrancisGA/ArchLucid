import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { OperatorHomeWorkspaceStatusSection } from "@/components/operator-home/OperatorHomeWorkspaceStatusSection";

const committedReviewMock = vi.hoisted(() => ({ value: true }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

const originalFetch = globalThis.fetch;

describe("OperatorHomeWorkspaceStatusSection", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
    committedReviewMock.value = true;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Degraded", entries: [] }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/roi-baseline")) {
        return new Response(JSON.stringify({ complete: true }), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    globalThis.fetch = originalFetch;
  });

  it("surfaces unhealthy setup health inside workspace status", async () => {
    renderWithOperatorQuery(<OperatorHomeWorkspaceStatusSection />);

    await waitFor(() => {
      expect(screen.getByText(/setup needs attention — open troubleshooting/i)).toBeInTheDocument();
    });
  });

  it("uses first-run collapsed summary without ROI baseline before a committed review (TB-349)", () => {
    committedReviewMock.value = false;

    renderWithOperatorQuery(<OperatorHomeWorkspaceStatusSection />);

    expect(screen.getByText("Workspace readiness signals.")).toBeInTheDocument();
    expect(screen.queryByText(/ROI baseline/i)).toBeNull();
  });
});
