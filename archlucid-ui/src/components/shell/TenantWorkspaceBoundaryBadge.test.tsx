import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TenantWorkspaceBoundaryBadge } from "@/components/shell/TenantWorkspaceBoundaryBadge";
import { DEV_SCOPE_TENANT_ID } from "@/lib/scope";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

vi.mock("@/components/cto-demo/CtoDemoHowItWorksTrigger", () => ({
  CtoDemoHowItWorksTrigger: (props: { trigger: React.ReactElement }) => props.trigger,
}));

describe("TenantWorkspaceBoundaryBadge", () => {
  afterEach(() => {
    buyerPolishedMock.value = false;
    localStorage.clear();
  });

  it("shows active tenant id from scope storage in live mode", () => {
    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "Pilot",
      projectLabel: "Primary",
    });

    render(<TenantWorkspaceBoundaryBadge variant="header" />);

    expect(screen.getByTestId("active-tenant-context-badge")).toHaveTextContent(
      /Active tenant: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/i,
    );
    expect(screen.getByTestId("active-tenant-context-badge")).toHaveAttribute("href", "/administration/workspace-settings");
  });

  it("shows showcase tenant name in buyer-polished mode", () => {
    buyerPolishedMock.value = true;

    render(<TenantWorkspaceBoundaryBadge variant="header" />);

    expect(screen.getByTestId("active-tenant-context-badge")).toHaveTextContent(
      /Active tenant: Customer Intake Showcase/i,
    );
  });

  it("falls back to dev tenant id when scope storage is empty", () => {
    render(<TenantWorkspaceBoundaryBadge variant="header" />);

    expect(screen.getByTestId("active-tenant-context-badge")).toHaveTextContent(
      new RegExp(`Active tenant: ${DEV_SCOPE_TENANT_ID}`, "i"),
    );
  });
});
