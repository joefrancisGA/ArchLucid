import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));
const evalChromeMock = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
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
import { ARCHITECTURES_HUB_PAGE_SUBTITLE, ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER } from "@/lib/architectures-hub-copy";
import { ARCHITECTURES_LIST_CLAIM_DISCIPLINE } from "@/lib/architectures-list-evidence-copy";

describe("ArchitecturesHubPageHeader (CA-25 / CA-36 / CA-47)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
    evalChromeMock.enabled = false;
  });

  it("uses draft-inventory claim discipline in Guided mode without eval subtitle", () => {
    render(<ArchitecturesHubPageHeader />);

    expect(screen.getByTestId("architectures-hub-claim-discipline")).toHaveTextContent(
      ARCHITECTURES_LIST_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("architectures-hub-page-subtitle")).toHaveTextContent(
      ARCHITECTURES_HUB_PAGE_SUBTITLE,
    );
    expect(screen.queryByText(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER)).not.toBeInTheDocument();
  });

  it("uses buyer-oriented Guided subtitle when eval chrome is on", () => {
    evalChromeMock.enabled = true;

    render(<ArchitecturesHubPageHeader />);

    expect(screen.getByTestId("architectures-hub-page-subtitle")).toHaveTextContent(
      ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER,
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
