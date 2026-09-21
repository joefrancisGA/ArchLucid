import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/infrastructure/terraform",
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  downloadInfraEvidenceTerraformAdvisoryZip: vi.fn(async () => undefined),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION,
} from "@/lib/governance/governance-infrastructure-copy";
import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH, SECURENOW_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { TerraformWorkbenchClient } from "./TerraformWorkbenchClient";

describe("TerraformWorkbenchClient buyer-polished chrome", () => {
  it("renders skip link, unscoped panel with product-line links, and sources strip", () => {
    searchParams = new URLSearchParams();
    render(<TerraformWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-terraform-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("infra-terraform-unscoped-panel")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-terraform-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION })).toHaveAttribute(
      "href",
      SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
    );
    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION })).toHaveAttribute(
      "href",
      SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
    );
  });
});
