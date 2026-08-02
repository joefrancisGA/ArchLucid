import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminSupportPageView } from "./AdminSupportPageView";
import type { UseAdminSupportPageModel } from "./use-admin-support-page";

function model(overrides: Partial<UseAdminSupportPageModel> = {}): UseAdminSupportPageModel {
  return {
    downloading: false,
    bundleStatus: "idle",
    error: null,
    lastGeneratedAt: null,
    isDemo: false,
    canGenerateBundle: true,
    showInternalDiagnostics: false,
    workspaceLabel: "Pilot workspace",
    onDownload: async () => undefined,
    ...overrides,
  };
}

describe("AdminSupportPageView", () => {
  it("shows guidance, report problem primary path, contact checklist, and visible bundle safety content", () => {
    render(<AdminSupportPageView model={model()} />);

    expect(screen.getByTestId("admin-support-guidance")).toHaveTextContent("Report problem");
    expect(screen.getByTestId("admin-support-report-problem")).toHaveTextContent("next business day");
    expect(screen.getByRole("link", { name: "Read the Report problem help topic" })).toHaveAttribute(
      "href",
      "/help/report-a-problem",
    );
    expect(screen.getByText("What to include")).toBeInTheDocument();
    expect(screen.getByText(/Report reference id \(from Report problem\)/i)).toBeInTheDocument();
    expect(screen.getByTestId("admin-support-bundle-safety")).toHaveTextContent("redacted before download");
    expect(screen.getByTestId("admin-support-bundle-included")).toHaveTextContent("Workspace diagnostics");
    expect(screen.getByTestId("admin-support-bundle-excluded")).toHaveTextContent("Secrets and API keys");
    expect(screen.getByTestId("admin-support-shortcut-report-a-problem")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-support-shortcut-admin-diagnostics")).not.toBeInTheDocument();
  });

  it("shows internal diagnostics shortcut when enabled", () => {
    render(<AdminSupportPageView model={model({ showInternalDiagnostics: true })} />);

    expect(screen.getByTestId("admin-support-shortcut-admin-diagnostics")).toBeInTheDocument();
    expect(screen.getByText("Internal")).toBeInTheDocument();
  });

  it("shows permission guidance when bundle generation is not allowed", () => {
    render(<AdminSupportPageView model={model({ canGenerateBundle: false })} />);

    expect(screen.getByTestId("admin-support-bundle-permission")).toBeInTheDocument();
    expect(screen.getByTestId("admin-support-download-bundle")).toBeDisabled();
  });
});
