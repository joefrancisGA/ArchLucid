import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingListDispositionRowActions } from "@/components/governance/findings/FindingListDispositionRowActions";
import { FindingKeyboardTriageProvider } from "@/components/governance/findings/FindingKeyboardTriageContext";

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => true,
}));

describe("FindingListDispositionRowActions (WA-18)", () => {
  it("requests disposition through triage host context", () => {
    const requestDisposition = vi.fn();

    render(
      <FindingKeyboardTriageProvider
        value={{
          requestDisposition,
          isDispositionBlocked: () => null,
          mutationsEnabled: true,
        }}
      >
        <FindingListDispositionRowActions findingId="finding-1" />
      </FindingKeyboardTriageProvider>,
    );

    fireEvent.click(screen.getByTestId("finding-list-accept-finding-1"));

    expect(requestDisposition).toHaveBeenCalledWith("finding-1", "Accepted");
  });

  it("disables actions and shows blocked reason for merge conflicts", () => {
    render(
      <FindingKeyboardTriageProvider
        value={{
          requestDisposition: vi.fn(),
          isDispositionBlocked: () => "Resolve merge conflict first.",
          mutationsEnabled: true,
        }}
      >
        <FindingListDispositionRowActions findingId="finding-2" />
      </FindingKeyboardTriageProvider>,
    );

    expect(screen.getByTestId("finding-list-accept-finding-2")).toBeDisabled();
    expect(screen.getByTestId("finding-list-accept-finding-2")).not.toHaveAttribute("title");
    expect(screen.getByTestId("finding-list-disposition-blocked-reason-finding-2")).toHaveTextContent(
      "Resolve merge conflict first.",
    );
  });
});
