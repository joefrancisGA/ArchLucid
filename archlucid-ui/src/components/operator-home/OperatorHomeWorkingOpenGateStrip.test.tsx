import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeWorkingOpenGateStrip } from "./OperatorHomeWorkingOpenGateStrip";

const readRecord = vi.fn();

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" as const }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ workspaceId: "ws-1", tenantId: "t", projectId: "p" }),
}));

vi.mock("@/lib/architecture/archlucid-open-gate-return-storage", () => ({
  readArchLucidOpenGateReturnRecord: (...args: unknown[]) => readRecord(...args),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("OperatorHomeWorkingOpenGateStrip", () => {
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

  it("renders the shared working-mode gate line", () => {
    render(<OperatorHomeWorkingOpenGateStrip />);

    expect(screen.getByTestId("operator-home-working-open-gate-link")).toHaveTextContent(
      "Uncommitted review",
    );
  });
});
