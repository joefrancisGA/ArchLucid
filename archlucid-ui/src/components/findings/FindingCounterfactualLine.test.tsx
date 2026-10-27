import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingCounterfactualLine } from "@/components/findings/FindingCounterfactualLine";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

describe("FindingCounterfactualLine", () => {
  it("labels missing counterfactual copy in working mode", () => {
    render(
      <FindingCounterfactualLine
        finding={{
          findingId: "f-1",
          recommendation: "",
        }}
      />,
    );

    expect(screen.getByText("Counterfactual was not stored.")).toBeInTheDocument();
  });
});
