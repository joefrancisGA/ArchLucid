import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ mode: "working", mounted: true, isWorkingMode: true }),
}));

vi.mock("@/hooks/use-working-career-rehearsal-door", () => ({
  useWorkingCareerRehearsalDoor: () => ({ door: "rehearsal", mounted: true, setDoor: vi.fn() }),
}));

vi.mock("@/hooks/session-ai-readiness-context", () => ({
  useSessionAiReadiness: () => ({
    hostMode: "Simulator",
    sessionMode: "Simulator",
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({
    workspaceId: "ws-demo",
    projectId: "proj-demo",
  }),
}));

vi.mock("@/lib/scope-switcher-display", () => ({
  isSampleWorkspacePresentationScope: () => true,
}));

import { InhabitHelpCurrentDeskContextPanel } from "@/components/help/InhabitHelpCurrentDeskContextPanel";

describe("InhabitHelpCurrentDeskContextPanel", () => {
  it("shows workspace density, review type, and host mode when state is available", () => {
    render(<InhabitHelpCurrentDeskContextPanel />);

    expect(screen.getByTestId("help-inhabit-the-architecture-current-density")).toHaveTextContent("Working");
    expect(screen.getByTestId("help-inhabit-the-architecture-current-review-type")).toHaveTextContent("Practice");
    expect(screen.getByTestId("help-inhabit-the-architecture-current-host-mode")).toHaveTextContent("Simulator");
    expect(screen.getByTestId("help-inhabit-the-architecture-demo-workspace-tag")).toBeInTheDocument();
  });
});
