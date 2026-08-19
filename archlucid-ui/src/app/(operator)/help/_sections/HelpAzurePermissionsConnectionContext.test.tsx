import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useSearchParams = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

import { HelpAzurePermissionsConnectionContext } from "@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContext";

describe("HelpAzurePermissionsConnectionContext", () => {
  it("omits empty connection identifiers when query context is missing", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());

    render(<HelpAzurePermissionsConnectionContext />);

    expect(screen.queryByText("Tenant ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Application (client) ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Subscription ID")).not.toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy Tenant ID unavailable/i })).not.toBeInTheDocument();
    expect(screen.getByText("Enterprise application name (suggested)")).toBeInTheDocument();
    expect(screen.getByText("Required roles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Azure connection setup" })).toBeInTheDocument();
  });

  it("shows tenant, client, and subscription values when query context is present", () => {
    useSearchParams.mockReturnValue(
      new URLSearchParams(
        "tenantId=11111111-1111-1111-1111-111111111111&clientId=22222222-2222-2222-2222-222222222222&subscriptionId=33333333-3333-3333-3333-333333333333",
      ),
    );

    render(<HelpAzurePermissionsConnectionContext />);

    expect(screen.getByText("11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByText("22222222-2222-2222-2222-222222222222")).toBeInTheDocument();
    expect(screen.getByText("33333333-3333-3333-3333-333333333333")).toBeInTheDocument();
  });

  it("rejects malformed tenant, client, and subscription query parameters", () => {
    useSearchParams.mockReturnValue(
      new URLSearchParams(
        "tenantId=not-a-guid&clientId=also-bad&subscriptionId='; DROP TABLE subscriptions;--",
      ),
    );

    render(<HelpAzurePermissionsConnectionContext />);

    expect(screen.queryByText("Tenant ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Application (client) ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Subscription ID")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Azure connection setup" })).toBeInTheDocument();
  });
});
