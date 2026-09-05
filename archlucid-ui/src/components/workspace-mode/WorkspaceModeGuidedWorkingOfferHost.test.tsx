import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({
  mode: "guided" as "guided" | "working",
  setAndPersist: vi.fn(),
}));

const evalChromeMock = vi.hoisted(() => ({ value: true }));
const commitContextMock = vi.hoisted(() => ({ hasCommittedManifest: false }));
const preferencesMock = vi.hoisted(() => ({ workspaceModeGraduationOffer: "pending" as const }));
const navigationMock = vi.hoisted(() => ({
  pathname: "/",
  replace: vi.fn(),
  search: "",
}));

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
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
  useSearchParams: () => new URLSearchParams(navigationMock.search),
}));

import { WorkspaceModeGuidedWorkingOfferHost } from "@/components/workspace-mode/WorkspaceModeGuidedWorkingOfferHost";

describe("WorkspaceModeGuidedWorkingOfferHost (FD-10)", () => {
  beforeEach(() => {
    workspaceModeMock.mode = "guided";
    workspaceModeMock.setAndPersist.mockClear();
    evalChromeMock.value = true;
    commitContextMock.hasCommittedManifest = false;
    preferencesMock.workspaceModeGraduationOffer = "pending";
    navigationMock.pathname = "/";
    navigationMock.search = "";
    navigationMock.replace.mockClear();
  });

  it("does not show the invitation before the first committed package", () => {
    const { container } = render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not router.replace when Overview already has no graduation-offer query", () => {
    const { rerender } = render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(navigationMock.replace).not.toHaveBeenCalled();

    rerender(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(navigationMock.replace).not.toHaveBeenCalled();
  });

  it("shows the opt-in Working invitation for Guided seats after first commit", () => {
    commitContextMock.hasCommittedManifest = true;

    render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(screen.getByTestId("workspace-mode-guided-working-offer-host")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-mode-graduation-offer")).toBeInTheDocument();
  });

  it("writes graduationOfferOpen once when the invitation becomes eligible", () => {
    commitContextMock.hasCommittedManifest = true;

    render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(navigationMock.replace).toHaveBeenCalledTimes(1);
    expect(navigationMock.replace).toHaveBeenCalledWith("/?graduationOfferOpen=1", { scroll: false });
  });

  it("does not router.replace again when the query already has graduationOfferOpen", () => {
    commitContextMock.hasCommittedManifest = true;
    navigationMock.search = "graduationOfferOpen=1";

    const { rerender } = render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(navigationMock.replace).not.toHaveBeenCalled();

    rerender(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(navigationMock.replace).not.toHaveBeenCalled();
  });

  it("does not show the invitation on Working seats", () => {
    workspaceModeMock.mode = "working";
    commitContextMock.hasCommittedManifest = true;

    const { container } = render(<WorkspaceModeGuidedWorkingOfferHost />);

    expect(container).toBeEmptyDOMElement();
  });

  it("calls the existing workspace-mode setter when the operator opts in", () => {
    commitContextMock.hasCommittedManifest = true;

    render(<WorkspaceModeGuidedWorkingOfferHost />);

    fireEvent.click(screen.getByTestId("workspace-mode-graduation-switch"));

    expect(workspaceModeMock.setAndPersist).toHaveBeenCalledWith("working");
  });
});
