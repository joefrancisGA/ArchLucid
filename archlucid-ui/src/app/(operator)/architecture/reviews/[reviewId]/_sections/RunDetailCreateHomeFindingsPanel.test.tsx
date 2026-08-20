import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_CREATE_HOME_FINDINGS_ACTIVITY_CTA_LABEL,
  RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD,
} from "@/lib/runs/run-detail-create-home-findings-copy";

import { RunDetailCreateHomeFindingsPanel } from "./RunDetailCreateHomeFindingsPanel";

describe("RunDetailCreateHomeFindingsPanel", () => {
  it("shows pre-finalize orientation copy without a duplicate Activity CTA (TB-1852)", () => {
    render(
      <RunDetailCreateHomeFindingsPanel runId="run-findings" packageCommitted={false}>
        <div data-testid="findings-body" />
      </RunDetailCreateHomeFindingsPanel>,
    );

    expect(screen.getByTestId("run-detail-create-home-findings-orientation")).toHaveTextContent(
      RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD,
    );
    expect(screen.queryByRole("link", { name: RUN_DETAIL_CREATE_HOME_FINDINGS_ACTIVITY_CTA_LABEL })).not.toBeInTheDocument();
    expect(screen.getByTestId("findings-body")).toBeInTheDocument();
  });

  it("omits orientation after the package is committed", () => {
    render(
      <RunDetailCreateHomeFindingsPanel runId="run-findings" packageCommitted>
        <div data-testid="findings-body" />
      </RunDetailCreateHomeFindingsPanel>,
    );

    expect(screen.queryByTestId("run-detail-create-home-findings-orientation")).not.toBeInTheDocument();
  });
});
