import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApprovalQueueContinueLastViewedRow } from "./ApprovalQueueContinueLastViewedRow";

describe("ApprovalQueueContinueLastViewedRow", () => {
  it("renders continue row for last viewed request", () => {
    render(
      <ApprovalQueueContinueLastViewedRow
        target={{
          approvalRequestId: "req-1",
          manifestVersion: "v3",
          sourceEnvironment: "dev",
          targetEnvironment: "prod",
        }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("approval-queue-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("approval-queue-continue-last-viewed-open")).toBeInTheDocument();
  });
});
