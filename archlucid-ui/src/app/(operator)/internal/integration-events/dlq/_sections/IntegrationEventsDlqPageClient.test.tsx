import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const nav = vi.hoisted(() => ({ callerAuthorityRank: 3 }));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => nav.callerAuthorityRank,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: nav.callerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

import { IntegrationEventsDlqPageClient } from "./IntegrationEventsDlqPageClient";

const sampleRow = {
  outboxId: "11111111-1111-1111-1111-111111111111",
  tenantId: "tenant-a",
  eventType: "jira.issue.create",
  runId: "run-1",
  deadLetteredUtc: "2026-07-01T00:00:00.000Z",
  retryCount: 3,
  lastErrorMessage: "HTTP 500",
};

describe("IntegrationEventsDlqPageClient", () => {
  beforeEach(() => {
    nav.callerAuthorityRank = 3;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([sampleRow]), { status: 200 })),
    );
  });

  it("enables Retry/Suppress/Bulk retry for AdminAuthority callers", async () => {
    render(<IntegrationEventsDlqPageClient />);

    expect(await screen.findByRole("button", { name: "Retry" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Suppress" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulk retry (100)" })).not.toBeDisabled();

    vi.unstubAllGlobals();
  });

  it("states cross-tenant scope and never claims the list is tenant-scoped (TB-1272)", async () => {
    render(<IntegrationEventsDlqPageClient />);

    const callout = await screen.findByTestId("integration-events-dlq-cross-tenant-callout");

    expect(callout).toHaveTextContent(/all tenants and event types/i);

    const page = screen.getByTestId("integration-events-dlq-page");
    const visible = (page.textContent ?? "").toLowerCase();

    expect(visible).toContain("cross-tenant");
    expect(visible).toContain("all tenants and event types");
    expect(visible).not.toContain("tenant-scoped");

    vi.unstubAllGlobals();
  });

  it("disables Retry/Suppress/Bulk retry for callers below AdminAuthority", async () => {
    nav.callerAuthorityRank = 2;

    render(<IntegrationEventsDlqPageClient />);

    expect(await screen.findByRole("button", { name: "Retry" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Suppress" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulk retry (100)" })).toBeDisabled();
    expect(screen.getByText(/Administrator access required to retry or suppress dead-letter rows\./)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});