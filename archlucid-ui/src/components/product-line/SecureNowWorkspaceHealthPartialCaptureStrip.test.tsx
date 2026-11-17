import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-latest-snapshot-capture-partial", () => ({
  useLatestSnapshotCaptureIsPartial: () => true,
}));
vi.mock("@/hooks/use-latest-partial-capture-snapshot-id", () => ({
  useLatestPartialCaptureSnapshotId: () => "snap-partial",
}));
vi.mock("@/hooks/use-securenow-partial-capture-return-path", () => ({
  useSecureNowPartialCaptureReturnPath: () => "/insights/workspace-health",
}));

import { SecureNowWorkspaceHealthPartialCaptureStrip } from "./SecureNowWorkspaceHealthPartialCaptureStrip";

describe("SecureNowWorkspaceHealthPartialCaptureStrip", () => {
  it("renders workspace health partial capture test id", () => {
    render(<SecureNowWorkspaceHealthPartialCaptureStrip />);

    expect(screen.getByTestId("workspace-health-partial-capture")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-health-partial-capture-cloud")).toBeInTheDocument();
  });
});