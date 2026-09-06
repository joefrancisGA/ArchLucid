import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("./ArchitecturesHubBreadcrumb", () => ({
  ArchitecturesHubBreadcrumb: () => null,
}));

vi.mock("./ArchitecturesHubHeaderActions", () => ({
  ArchitecturesHubHeaderActions: () => null,
}));

import { ArchitecturesHubPageHeader } from "./ArchitecturesHubPageHeader";
import { ARCHITECTURE_IDENTITY_LIST_CLAIM_DISCIPLINE } from "@/lib/architecture/architecture-identity-desk-copy";
import { ARCHITECTURES_HUB_PAGE_SUBTITLE } from "@/lib/architectures-hub-copy";
import { ARCHITECTURES_LIST_CLAIM_DISCIPLINE } from "@/lib/architectures-list-evidence-copy";

describe("ArchitecturesHubPageHeader (CA-25 / CA-36)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
  });

  it("uses draft-inventory claim discipline in Guided mode", () => {
    render(<ArchitecturesHubPageHeader />);

    expect(screen.getByTestId("architectures-hub-claim-discipline")).toHaveTextContent(
      ARCHITECTURES_LIST_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("architectures-hub-page-subtitle")).toHaveTextContent(
      ARCHITECTURES_HUB_PAGE_SUBTITLE,
    );
  });

  it("uses identity portfolio copy in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<ArchitecturesHubPageHeader />);

    expect(screen.getByTestId("architectures-hub-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_IDENTITY_LIST_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("architectures-hub-page-subtitle")).toHaveTextContent(
      "Durable architecture identities",
    );
  });
});
