import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readRecord = vi.fn();

vi.mock("@/lib/architecture/archlucid-open-gate-return-storage", () => ({
  readArchLucidOpenGateReturnRecord: (...args: unknown[]) => readRecord(...args),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ workspaceId: "ws-1", tenantId: "t", projectId: "p" }),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" as const }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => ({ isWorkingMode: true }),
  };
});

vi.mock("./ArchitecturesHubListSection", () => ({
  ArchitecturesHubListSection: () => <div data-testid="architectures-hub-list" />,
}));

vi.mock("./ArchitecturesHubObjectMapStrip", () => ({
  ArchitecturesHubObjectMapStrip: () => null,
}));

vi.mock("./ArchitecturesHubWorkingAskBindEmptyStrip", () => ({
  ArchitecturesHubWorkingAskBindEmptyStrip: () => null,
}));

vi.mock("./ArchitecturesHubWorkingGraphBindEmptyStrip", () => ({
  ArchitecturesHubWorkingGraphBindEmptyStrip: () => null,
}));

vi.mock("./ArchitecturesHubPageHeader", () => ({
  ArchitecturesHubPageHeader: () => <div data-testid="architectures-hub-page-header" />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ArchitecturesHubPageShell } from "./ArchitecturesHubPageShell";

describe("ArchitecturesHubPageShell working mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRecord.mockReturnValue(null);
  });

  it("shows the browser-local open gate line when a record exists", () => {
    readRecord.mockReturnValue({
      runId: "run-1",
      openGateLabel: "Open disposition",
      href: "/architecture/reviews/run-1?tab=decisions",
      recordedAtUtc: new Date().toISOString(),
      findingId: null,
    });

    render(<ArchitecturesHubPageShell />);

    expect(screen.getByTestId("operator-home-working-open-gate")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-working-open-gate-link")).toHaveTextContent("Open disposition");
  });
});
