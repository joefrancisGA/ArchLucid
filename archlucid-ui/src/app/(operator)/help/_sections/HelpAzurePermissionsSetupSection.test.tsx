import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpAzurePermissionsSetupSection } from "@/app/(operator)/help/_sections/HelpAzurePermissionsSetupSection";

describe("HelpAzurePermissionsSetupSection", () => {
  it("falls back to YOUR_SUBSCRIPTION_ID when subscriptionId is not a GUID", () => {
    render(<HelpAzurePermissionsSetupSection subscriptionId="'; rm -rf /" />);

    fireEvent.click(screen.getByRole("tab", { name: "Azure CLI" }));

    expect(screen.getByText(/YOUR_SUBSCRIPTION_ID/)).toBeInTheDocument();
    expect(screen.queryByText("'; rm -rf /")).not.toBeInTheDocument();
  });
});
