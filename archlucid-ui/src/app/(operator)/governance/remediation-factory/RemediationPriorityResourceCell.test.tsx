import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL } from "@/lib/infra-evidence/format-azure-resource-display";

import { RemediationPriorityResourceCell } from "./RemediationPriorityResourceCell";

describe("RemediationPriorityResourceCell", () => {
  it("shows the parsed resource name and hides the full id until Show resource id is opened", () => {
    const cloudResourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/customerdata";

    render(
      <table>
        <tbody>
          <tr>
            <RemediationPriorityResourceCell
              findingId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
              cloudResourceId={cloudResourceId}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText("customerdata")).toBeInTheDocument();
    expect(screen.queryByText(cloudResourceId)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("remediation-priority-resource-id-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

    expect(screen.getByText(cloudResourceId)).toBeInTheDocument();
  });

  it("shows Name not recorded without a disclosure when cloudResourceId is missing", () => {
    render(
      <table>
        <tbody>
          <tr>
            <RemediationPriorityResourceCell findingId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" cloudResourceId={null} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText(AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL)).toBeInTheDocument();
    expect(screen.queryByText("Show resource id")).not.toBeInTheDocument();
  });
});
