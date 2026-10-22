import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/governance/recurrence-schedules");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { ScopeChangeConsequenceBanner } from "@/components/ScopeChangeConsequenceBanner";
import {
  writeOperatorScopeToStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import {
  SCOPE_CHANGE_CONSEQUENCE_HEADING,
  SCOPE_CHANGE_CONSEQUENCE_HONESTY,
  SCOPE_CHANGE_CONSEQUENCE_LEAD,
  isScopeChangeConsequenceDismissed,
} from "@/lib/scope-change-consequence-banner";

const SAMPLE_SCOPE: OperatorScopeRecord = {
  tenantId: "tenant-a",
  workspaceId: "workspace-a",
  projectId: "project-a",
  workspaceLabel: "Workspace A",
  projectLabel: "Project A",
};

describe("ScopeChangeConsequenceBanner (TB-2288)", () => {
  afterEach(() => {
    mockUsePathname.mockReturnValue("/governance/recurrence-schedules");
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("stays hidden until a mid-session scope change event", () => {
    render(<ScopeChangeConsequenceBanner />);

    expect(screen.queryByTestId("scope-change-consequence-banner")).not.toBeInTheDocument();
  });

  it("shows honesty copy after scope apply and dismisses for the current change event", async () => {
    render(<ScopeChangeConsequenceBanner />);

    writeOperatorScopeToStorage(SAMPLE_SCOPE);

    await waitFor(() => {
      expect(screen.getByTestId("scope-change-consequence-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(SCOPE_CHANGE_CONSEQUENCE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SCOPE_CHANGE_CONSEQUENCE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("scope-change-consequence-banner-honesty")).toHaveTextContent(
      SCOPE_CHANGE_CONSEQUENCE_HONESTY,
    );
    expect(screen.getByTestId("scope-change-consequence-banner")).toHaveAttribute(
      "data-event-key",
      "tenant-a|workspace-a|project-a",
    );

    fireEvent.click(screen.getByTestId("scope-change-consequence-banner-dismiss"));

    expect(screen.queryByTestId("scope-change-consequence-banner")).not.toBeInTheDocument();
    expect(isScopeChangeConsequenceDismissed("tenant-a|workspace-a|project-a")).toBe(true);
  });

  it("does not render on static help routes even when a scope change event is active", async () => {
    mockUsePathname.mockReturnValue("/help/recurrence-schedules");

    render(<ScopeChangeConsequenceBanner />);

    writeOperatorScopeToStorage(SAMPLE_SCOPE);

    await waitFor(() => {
      expect(screen.queryByTestId("scope-change-consequence-banner")).not.toBeInTheDocument();
    });
  });

  it("uses neutral status chrome without an h2 heading", async () => {
    render(<ScopeChangeConsequenceBanner />);

    writeOperatorScopeToStorage(SAMPLE_SCOPE);

    await waitFor(() => {
      expect(screen.getByTestId("scope-change-consequence-banner")).toBeInTheDocument();
    });

    const banner = screen.getByTestId("scope-change-consequence-banner");

    expect(banner.className).toContain("border-neutral-200");
    expect(banner.className).not.toContain("bg-teal-50");
    expect(banner.querySelector("h2")).toBeNull();
    expect(banner.querySelector("#scope-change-consequence-banner-heading")?.tagName).toBe("P");
  });
});
