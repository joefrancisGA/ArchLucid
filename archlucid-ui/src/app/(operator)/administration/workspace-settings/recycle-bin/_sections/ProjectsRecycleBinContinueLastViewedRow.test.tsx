import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectsRecycleBinContinueLastViewedRow } from "./ProjectsRecycleBinContinueLastViewedRow";

describe("ProjectsRecycleBinContinueLastViewedRow", () => {
  it("renders continue row for last viewed deleted project", () => {
    render(
      <ProjectsRecycleBinContinueLastViewedRow
        target={{
          projectId: "proj-1",
          projectName: "Contoso Core",
          workspaceId: "ws-1",
          workspaceName: "Production",
        }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("projects-recycle-bin-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Contoso Core")).toBeInTheDocument();
  });
});
