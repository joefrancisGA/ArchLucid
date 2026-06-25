import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminAwsCloudConnectionsPageClient } from "./AdminAwsCloudConnectionsPageClient";

describe("AdminAwsCloudConnectionsPageClient", () => {
  it("renders system-admin-only AWS connector scope without buyer cloud connections chrome", () => {
    render(<AdminAwsCloudConnectionsPageClient />);

    expect(screen.getByTestId("admin-aws-cloud-connections-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AWS cloud connections" })).toBeInTheDocument();
    expect(screen.getByText("System admin only")).toBeInTheDocument();
    expect(screen.getByText(/cross-account IAM trust/i)).toBeInTheDocument();
    expect(screen.getByText(/TB-403/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cloud connections" })).toHaveAttribute("href", "/settings/cloud-connections");
    expect(screen.getByText(/GCP continuous ingestion stays on the V1\.1 roadmap/i)).toBeInTheDocument();
  });
});
