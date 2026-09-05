import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({
  mode: "guided" as "guided" | "working",
  setAndPersist: vi.fn(),
}));

const evalChromeMock = vi.hoisted(() => ({ value: true }));
const commitContextMock = vi.hoisted(() => ({ hasCommittedManifest: false }));
const preferencesMock = vi.hoisted(() => ({ workspaceModeGraduationOffer: "pending" as const }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.mode,
    setAndPersist: workspaceModeMock.setAndPersist,
  }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.value,
}));

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => ({ data: commitContextMock }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQuery: () => ({ data: preferencesMock }),
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { WorkspaceModeGuidedWorkingOfferHost } from "@/components/workspace-mode/WorkspaceModeGuidedWorkingOfferHost";

describe("WorkspaceModeGuidedWorkingOfferHost (FD-10)", () => {
  it("does not show the invitation before the first committed package", () => {
    workspaceModeMock.mode = "guided";
    evalChromeMock.value = true;
    commitContextMock.hasCommittedManifest = false;

    const { container } = render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the opt-in Working invitation for Guided seats after first commit", () => {
    workspaceModeMock.mode = "guided";
    evalChromeMock.value = true;
    commitContextMock.hasCommittedManifest = true;
    preferencesMock.workspaceModeGraduationOffer = "pending";

    render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(screen.getByTestId("workspace-mode-guided-working-offer-host")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-mode-graduation-offer")).toBeInTheDocument();
  });

  it("does not show the invitation on Working seats", () => {
    workspaceModeMock.mode = "working";
    evalChromeMock.value = true;
    commitContextMock.hasCommittedManifest = true;

    const { container } = render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(container).toBeEmptyDOMElement();
  });

  it("calls the existing workspace-mode setter when the operator opts in", () => {
    workspaceModeMock.mode = "guided";
    evalChromeMock.value = true;
    commitContextMock.hasCommittedManifest = true;
    preferencesMock.workspaceModeGraduationOffer = "pending";
    workspaceModeMock.setAndPersist.mockClear();

    render(<WorkspaceModeGuidedWorkingOfferHost />);

    fireEvent.click(screen.getByTestId("workspace-mode-graduation-switch"));

    expect(workspaceModeMock.setAndPersist).toHaveBeenCalledWith("working");
  });
});
