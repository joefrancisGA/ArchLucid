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

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => ({ isWorkingMode: true }),
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ImpactPreviewWorkingOpenGateStrip } from "./ImpactPreviewWorkingOpenGateStrip";

describe("ImpactPreviewWorkingOpenGateStrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRecord.mockReturnValue({
      runId: "run-1",
      openGateLabel: "Uncommitted review",
      href: "/architecture/reviews/run-1",
      recordedAtUtc: new Date().toISOString(),
      findingId: null,
    });
  });

  it("shows the stored open gate link in working mode", () => {
    render(<ImpactPreviewWorkingOpenGateStrip />);

    expect(screen.getByTestId("operator-home-working-open-gate-link")).toHaveTextContent("Uncommitted review");
  });
});
