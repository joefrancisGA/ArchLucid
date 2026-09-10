import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkingCareerRehearsalChooser } from "@/components/workspace-mode/WorkingCareerRehearsalChooser";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const workspaceModeMock = vi.hoisted(() => ({
  mode: "working" as "guided" | "working",
  mounted: true,
}));

const doorMock = vi.hoisted(() => ({
  door: "rehearsal" as "career" | "rehearsal",
  mounted: true,
  setDoor: vi.fn(),
  cycleDoor: vi.fn(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.mode,
    mounted: workspaceModeMock.mounted,
    accountSyncState: "synced",
    isWorkingMode: workspaceModeMock.mode === "working",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-working-career-rehearsal-door", () => ({
  useWorkingCareerRehearsalDoor: () => ({
    door: doorMock.door,
    mounted: doorMock.mounted,
    setDoor: doorMock.setDoor,
    cycleDoor: doorMock.cycleDoor,
  }),
}));

describe("WorkingCareerRehearsalChooser", () => {
  beforeEach(() => {
    window.localStorage.clear();
    workspaceModeMock.mode = "working";
    workspaceModeMock.mounted = true;
    doorMock.door = "rehearsal";
    doorMock.mounted = true;
    doorMock.setDoor.mockReset();
    doorMock.cycleDoor.mockReset();
  });

  it("renders Career and Rehearsal segmented controls in Working mode", () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("working-career-rehearsal-chooser")).toBeInTheDocument();
    expect(screen.getByTestId("working-career-rehearsal-door-career")).toHaveTextContent(
      WORKING_CAREER_DOOR_LABEL,
    );
    expect(screen.getByTestId("working-career-rehearsal-door-rehearsal")).toHaveTextContent(
      WORKING_REHEARSAL_DOOR_LABEL,
    );
    expect(screen.getByTestId("working-career-rehearsal-door-rehearsal")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("hides in Guided mode", () => {
    workspaceModeMock.mode = "guided";

    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    expect(screen.queryByTestId("working-career-rehearsal-chooser")).not.toBeInTheDocument();
  });

  it("calls setDoor when Career is selected", () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByTestId("working-career-rehearsal-door-career"));

    expect(doorMock.setDoor).toHaveBeenCalledWith("career");
  });
});
