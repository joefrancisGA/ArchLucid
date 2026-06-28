import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminAwsCloudConnectionsPageClient } from "./AdminAwsCloudConnectionsPageClient";

describe("AdminAwsCloudConnectionsPageClient", () => {
  it("renders AWS connector scope without system-admin badge", () => {
    render(<AdminAwsCloudConnectionsPageClient />);

    expect(screen.getByTestId("admin-aws-cloud-connections-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AWS cloud connections" })).toBeInTheDocument();
    expect(screen.getByText(/cross-account IAM trust/i)).toBeInTheDocument();
    expect(screen.getByText(/HostedAwsExtractor:Enabled/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cloud connections" })).toHaveAttribute("href", "/integrations/cloud-connections");
    expect(screen.queryByText(/V1\.1 roadmap/i)).not.toBeInTheDocument();
  });
});
