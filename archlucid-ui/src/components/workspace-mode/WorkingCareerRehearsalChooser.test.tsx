import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkingCareerRehearsalChooser } from "@/components/workspace-mode/WorkingCareerRehearsalChooser";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
} from "@/lib/governance/working-career-door-gate-copy";
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
}));

const gateMock = vi.hoisted(() => ({
  isCareerExecuteBlocked: false,
  blockReason: null as string | null,
  blockedDetail: null as string | null,
  platformSettingsHref: "/administration/connection-status",
}));

const evaluateGateMock = vi.hoisted(() =>
  vi.fn((door: "career" | "rehearsal") => ({
    isCareerExecuteBlocked: door === "career" && gateMock.isCareerExecuteBlocked,
    blockReason: door === "career" ? gateMock.blockReason : null,
    blockedDetail: door === "career" ? gateMock.blockedDetail : null,
    platformSettingsHref: "/administration/connection-status",
  })),
);

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
  }),
}));

vi.mock("@/hooks/use-working-career-door-gate", () => ({
  useWorkingCareerDoorGate: () => ({
    isCareerExecuteBlocked: gateMock.isCareerExecuteBlocked,
    blockReason: gateMock.blockReason,
    blockedDetail: gateMock.blockedDetail,
    platformSettingsHref: gateMock.platformSettingsHref,
  }),
  useEvaluateWorkingCareerDoorGate: () => evaluateGateMock,
}));

describe("WorkingCareerRehearsalChooser", () => {
  beforeEach(() => {
    workspaceModeMock.mode = "working";
    workspaceModeMock.mounted = true;
    doorMock.door = "rehearsal";
    doorMock.mounted = true;
    gateMock.isCareerExecuteBlocked = false;
    gateMock.blockReason = null;
    gateMock.blockedDetail = null;
    doorMock.setDoor.mockReset();
    evaluateGateMock.mockClear();
  });

  it("renders Career and Rehearsal segmented controls in Working mode", () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("working-career-rehearsal-chooser")).toBeInTheDocument();
    expect(screen.getByTestId("working-career-rehearsal-chooser")).toHaveAttribute(
      "data-chooser-source",
      "command-bar",
    );
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

  it("calls setDoor when Career is available", () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByTestId("working-career-rehearsal-door-career"));

    expect(doorMock.setDoor).toHaveBeenCalledWith("career");
  });

  it("shows blocked dialog instead of selecting Career when host cannot run Real", () => {
    gateMock.isCareerExecuteBlocked = true;
    gateMock.blockReason = "host-simulator-pinned";
    gateMock.blockedDetail = WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL;

    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByTestId("working-career-rehearsal-door-career"));

    expect(doorMock.setDoor).not.toHaveBeenCalled();
    expect(screen.getByTestId("working-career-door-blocked-dialog")).toBeInTheDocument();
    expect(screen.getByText(WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL)).toBeInTheDocument();
  });

  it("shows blocked tag and effective Rehearsal execute when Career is stored but blocked", () => {
    doorMock.door = "career";
    gateMock.isCareerExecuteBlocked = true;
    gateMock.blockReason = "host-simulator-pinned";
    gateMock.blockedDetail = WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL;

    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("working-career-door-blocked-tag")).toBeInTheDocument();
    expect(screen.getByTestId("working-career-rehearsal-chooser")).toHaveAttribute(
      "data-effective-door",
      "rehearsal",
    );
  });

  it("moves to Career with ArrowRight from Rehearsal on the segmented control", () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser />
      </TooltipProvider>,
    );

    fireEvent.keyDown(screen.getByTestId("working-career-rehearsal-door-rehearsal"), {
      key: "ArrowRight",
    });

    expect(doorMock.setDoor).toHaveBeenCalledWith("career");
  });

  it("marks the findings mount so it is the same control without a second shortcut host", () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <WorkingCareerRehearsalChooser source="findings" />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("working-career-rehearsal-chooser")).toHaveAttribute(
      "data-chooser-source",
      "findings",
    );
  });
});
