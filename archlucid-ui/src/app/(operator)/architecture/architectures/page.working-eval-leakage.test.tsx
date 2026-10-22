import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: false }));
const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => workspaceModeMock,
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("./_sections/ArchitecturesHubListSection", () => ({
  ArchitecturesHubListSection: () => <div data-testid="architecture-identity-list" />,
}));

vi.mock("./_sections/ArchitecturesHubHeaderActions", () => ({
  ArchitecturesHubHeaderActions: () => <div data-testid="architectures-hub-header-actions" />,
}));

import ArchitecturesListPage from "./page";
import {
  ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE,
  ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER } from "@/lib/architectures-hub-copy";

describe("ArchitecturesListPage eval leakage guard (CA-47)", () => {
  beforeEach(() => {
    evalChromeMock.enabled = false;
    workspaceModeMock.isWorkingMode = true;
  });

  it("keeps Working hub actions on identity portfolio copy without Guided teaching chrome", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(
      ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE,
    );
    expect(screen.getByTestId("architectures-hub-page-subtitle")).toHaveTextContent(
      ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE,
    );
    expect(screen.queryByText(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER)).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-list")).toBeInTheDocument();
    expect(screen.queryByTestId("architectures-hub-orientation")).not.toBeInTheDocument();
    expect(screen.getByTestId("architectures-hub-header-actions")).toBeInTheDocument();
  });

  it("allows Guided buyer subtitle and hub orientation strip in eval chrome", () => {
    evalChromeMock.enabled = true;
    workspaceModeMock.isWorkingMode = false;

    render(<ArchitecturesListPage />);

    expect(screen.getByText(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("architectures-hub-orientation")).toBeInTheDocument();
  });
});
