import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeWorkingOpenGateLine } from "./OperatorHomeWorkingOpenGateLine";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" as const }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ workspaceId: "ws-1", tenantId: "t", projectId: "p" }),
}));

const readRecord = vi.fn();

vi.mock("@/lib/architecture/archlucid-open-gate-return-storage", () => ({
  readArchLucidOpenGateReturnRecord: (...args: unknown[]) => readRecord(...args),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("OperatorHomeWorkingOpenGateLine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRecord.mockReturnValue(null);
  });

  it("shows the stored open gate link in working mode", () => {
    readRecord.mockReturnValue({
      runId: "run-1",
      openGateLabel: "Uncited finding",
      href: "/architecture/reviews/run-1?tab=findings",
      recordedAtUtc: new Date().toISOString(),
      findingId: "f-1",
    });

    render(<OperatorHomeWorkingOpenGateLine workingMode />);

    expect(screen.getByTestId("operator-home-working-open-gate")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-working-open-gate-link")).toHaveTextContent("Uncited finding");
    expect(screen.getByTestId("operator-home-working-open-gate-link")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?tab=findings",
    );
  });

  it("renders nothing when no record is stored", () => {
    render(<OperatorHomeWorkingOpenGateLine workingMode />);

    expect(screen.queryByTestId("operator-home-working-open-gate")).not.toBeInTheDocument();
  });

  it("renders nothing when not in working mode", () => {
    readRecord.mockReturnValue({
      runId: "run-1",
      openGateLabel: "Uncited finding",
      href: "/architecture/reviews/run-1",
      recordedAtUtc: new Date().toISOString(),
    });

    render(<OperatorHomeWorkingOpenGateLine workingMode={false} />);

    expect(screen.queryByTestId("operator-home-working-open-gate")).not.toBeInTheDocument();
  });
});
