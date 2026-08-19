import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzureCloudConnectionRolesTable } from "@/components/help/AzureCloudConnectionRolesTable";
import { formatAzurePermissionRequirementLabel } from "@/lib/azure-cloud-connection-permissions-manifest";

describe("AzureCloudConnectionRolesTable", () => {
  it("renders summary rows without expanded details when expandedDetails is false", () => {
    render(<AzureCloudConnectionRolesTable expandedDetails={false} testId="azure-roles-table-test" />);

    const table = screen.getByTestId("azure-roles-table-test");
    expect(within(table).getByText(formatAzurePermissionRequirementLabel("required"))).toBeInTheDocument();
    expect(within(table).queryByText(/Capabilities enabled/i)).toBeNull();
  });

  it("renders expandable role details when expandedDetails is true", () => {
    render(<AzureCloudConnectionRolesTable expandedDetails testId="azure-roles-table-expanded-test" />);

    const table = screen.getByTestId("azure-roles-table-expanded-test");
    expect(within(table).getAllByText(/Capabilities enabled/i).length).toBeGreaterThan(0);
  });
});
