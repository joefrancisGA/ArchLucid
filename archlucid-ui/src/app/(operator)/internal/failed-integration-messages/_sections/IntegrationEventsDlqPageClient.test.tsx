import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT } from "@/lib/integration-events-dlq-page-copy";

const nav = vi.hoisted(() => ({ callerAuthorityRank: 3 }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
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

  it("aligns page H1 with nav Failed integration messages (TB-1273)", async () => {
    render(<IntegrationEventsDlqPageClient />);

    expect(await screen.findByTestId("integration-events-dlq-page-title")).toHaveTextContent(
      OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages,
    );
    expect(screen.getByTestId("integration-events-dlq-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("integration-events-dlq-claim-discipline")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("links review cells to architecture reviews when runId is present (TB-1274)", async () => {
    render(<IntegrationEventsDlqPageClient />);

    const reviewCell = await screen.findByTestId(
      `integration-events-dlq-review-cell-${sampleRow.outboxId}`,
    );
    const reviewLink = within(reviewCell).getByRole("link");

    expect(reviewLink).toHaveAttribute("href", "/architecture/reviews/run-1");

    vi.unstubAllGlobals();
  });

  it("uses compact empty state for happy empty and avoids emerald-only empty copy (TB-1275)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(<IntegrationEventsDlqPageClient />);

    const empty = await screen.findByTestId("integration-events-dlq-empty-state");

    expect(within(empty).getByText("No failed integration messages")).toBeInTheDocument();
    expect(document.querySelector(".text-emerald-800")).toBeNull();
    expect(document.querySelector(".text-emerald-300")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/No dead-lettered integration events/i);

    vi.unstubAllGlobals();
  });

  it("demotes bulk retry beside primary Refresh and requires typed Dialog confirmation (TB-1276)", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<IntegrationEventsDlqPageClient />);

    const actions = await screen.findByTestId("integration-events-dlq-header-actions");
    const refresh = within(actions).getByTestId("integration-events-dlq-refresh-button");
    const bulk = within(actions).getByTestId("integration-events-dlq-bulk-retry-button");

    expect(refresh.className).toMatch(/primary|bg-\[var\(--al-primary-action-bg\)\]/);
    expect(bulk.className).toMatch(/destructive|bg-\[var\(--al-danger-action-bg\)\]/);

    fireEvent.click(bulk);

    const heading = await screen.findByRole("heading", { name: "Bulk retry failed messages?" });
    const dialog = heading.closest('[role="alertdialog"]');

    expect(dialog).not.toBeNull();

    const confirm = within(dialog as HTMLElement).getByRole("button", { name: "Bulk retry (100)" });

    expect(confirm).toBeDisabled();

    fireEvent.change(within(dialog as HTMLElement).getByTestId("integration-events-dlq-bulk-retry-acknowledgment-input"), {
      target: { value: INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT },
    });

    expect(confirm).not.toBeDisabled();
    expect(confirmSpy).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("disables Retry/Suppress/Bulk retry for callers below AdminAuthority", async () => {
    nav.callerAuthorityRank = 2;

    render(<IntegrationEventsDlqPageClient />);

    expect(await screen.findByRole("button", { name: "Retry" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Suppress" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulk retry (100)" })).toBeDisabled();
    expect(
      screen.getByText(/Administrator access required to retry or suppress failed integration messages\./),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});

describe("IntegrationEventsDlqConfirmDialogs (TB-2370)", () => {
  it("renders suppress confirm through ConfirmationDialog", async () => {
    const { IntegrationEventsDlqSuppressConfirmDialog } = await import("./IntegrationEventsDlqConfirmDialogs");
    const onConfirm = vi.fn();

    render(
      <IntegrationEventsDlqSuppressConfirmDialog open busy={false} onCancel={vi.fn()} onConfirm={onConfirm} />,
    );

    expect(screen.getByRole("heading", { name: "Suppress this message?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Suppress" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
