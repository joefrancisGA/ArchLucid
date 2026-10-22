import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpAzurePermissionsConnectionContextLoadingSkeleton } from "@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContextLoadingSkeleton";
import { AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID } from "@/lib/azure-permissions-help-evidence-copy";

describe("HelpAzurePermissionsConnectionContextLoadingSkeleton (TB-1630)", () => {
  it("exposes a shell-standard loading skeleton for connection values", () => {
    render(<HelpAzurePermissionsConnectionContextLoadingSkeleton />);

    const skeleton = screen.getByTestId(AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID);

    expect(skeleton).toHaveAttribute("role", "status");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton).toHaveAttribute("aria-label", "Loading connection values");
  });
});
