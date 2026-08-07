import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectView } from "./FindingInspectView";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => false,
};
});

describe("FindingInspectView review terminology", () => {
  it("uses review vocabulary with runId bridge when URL runId mismatches payload", () => {
    render(
      <FindingInspectView
        runId="url-review-id"
        decodedFindingId="finding-1"
        payload={{
          runId: "payload-review-id",
          findingId: "finding-1",
          typedPayload: null,
          decisionRuleId: null,
          decisionRuleName: null,
          evidence: [],
          recommendedActions: [],
          auditRowId: null,
          manifestVersion: null,
        }}
        failure={null}
      />,
    );

    expect(screen.getByText(/belongs to review/i)).toBeInTheDocument();
    expect(screen.getByText("payload-review-id")).toBeInTheDocument();
    expect(screen.getByText(/Review ID \(API field: runId\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/belongs to run/i)).toBeNull();
  });
});
