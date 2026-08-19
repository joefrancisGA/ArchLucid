import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { auditTrailPageSubtitle } from "@/lib/audit-trail-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/audit",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AuditPageHeader } from "@/app/(operator)/governance/audit/_sections/AuditPageHeader";

describe("AuditPageHeader", () => {
  it("renders h2, help, refresh, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <AuditPageHeader
        title="Audit trail"
        subtitle={auditTrailPageSubtitle(false)}
        searching={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Audit trail" })).toBeInTheDocument();
    expect(screen.getByText(auditTrailPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("audit-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("audit-header-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("audit-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("audit-header-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
