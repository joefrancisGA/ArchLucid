import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture-creation-bootstrap";
import {
  ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE,
  ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
  ARCHITECTURE_CREATION_REVIEW_BOUNDARY,
} from "@/lib/create-vs-review-intake-copy";
import {
  CONTINUE_DRAFT_LABEL,
  START_NEW_ARCHITECTURE_LABEL,
  VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/architecture-workflow-labels";
import {
  CREATE_ARCHITECTURE_BOOTSTRAP_TIMEOUT_MS,
  CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE,
  CREATE_ARCHITECTURE_STARTING_LABEL,
} from "@/lib/review-start-progress-copy";
import { UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture-draft-status";

const listArchitectureDraftRegistryEntries = vi.fn();
const initializeArchitectureCreation = vi.fn();
const clearArchitectureCreationDraftId = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ replace }),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/architecture-draft-registry", () => ({
  listArchitectureDraftRegistryEntries: () => listArchitectureDraftRegistryEntries(),
}));

vi.mock("@/lib/architecture-creation-init", () => ({
  initializeArchitectureCreation: () => initializeArchitectureCreation(),
}));

vi.mock("@/lib/architecture-creation-session", () => ({
  clearArchitectureCreationDraftId: () => clearArchitectureCreationDraftId(),
}));

vi.mock("@/lib/architecture-draft-resume-telemetry", () => ({
  trackArchitectureDraftResumeClick: vi.fn(),
}));

import { ArchitectureCreationBootstrap } from "./ArchitectureCreationBootstrap";

function draftEntry(overrides: Record<string, unknown> = {}) {
  return {
    architectureId: "draft-001",
    displayName: "Claims intake draft",
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  listArchitectureDraftRegistryEntries.mockReset();
  initializeArchitectureCreation.mockReset();
  clearArchitectureCreationDraftId.mockReset();
  replace.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ArchitectureCreationBootstrap", () => {
  it("offers resume cards when drafts already exist without auto-creating", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([draftEntry()]);

    render(<ArchitectureCreationBootstrap />);

    expect(await screen.findByTestId("architecture-creation-bootstrap-resume-choice")).toBeInTheDocument();
    expect(initializeArchitectureCreation).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: CONTINUE_DRAFT_LABEL })).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-001",
    );
    expect(screen.getByRole("button", { name: START_NEW_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: VIEW_ALL_DRAFTS_LABEL })).toHaveAttribute("href", "/architecture/architectures");
    expect(screen.getByText(ARCHITECTURE_CREATION_REVIEW_BOUNDARY)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE)).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-creation-bootstrap-loading")).not.toBeInTheDocument();
  });

  it("does not auto-create when no drafts exist", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitectureCreationBootstrap />);

    expect(await screen.findByTestId("architecture-creation-bootstrap-empty")).toHaveTextContent(
      ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
    );
    expect(initializeArchitectureCreation).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: START_NEW_ARCHITECTURE_LABEL })).toBeInTheDocument();
  });

  it("never renders the bootstrap identifier as a draft title", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      draftEntry({
        displayName: UNTITLED_ARCHITECTURE_LABEL,
      }),
    ]);

    render(<ArchitectureCreationBootstrap />);

    expect(await screen.findByText(UNTITLED_ARCHITECTURE_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(/architecture-draft-bootstrap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT)).not.toBeInTheDocument();
  });

  it("starts a new draft with a pending state and blocks duplicate clicks", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([draftEntry()]);
    let resolveCreate: ((value: { draftId: string }) => void) | undefined;
    initializeArchitectureCreation.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    render(<ArchitectureCreationBootstrap />);

    const startButton = await screen.findByTestId("architecture-creation-start-new");
    fireEvent.click(startButton);
    fireEvent.click(startButton);

    expect(await screen.findByTestId("architecture-creation-bootstrap-creating")).toHaveTextContent(
      CREATE_ARCHITECTURE_STARTING_LABEL,
    );
    expect(initializeArchitectureCreation).toHaveBeenCalledTimes(1);
    expect(clearArchitectureCreationDraftId).toHaveBeenCalledTimes(1);

    resolveCreate?.({ draftId: "draft-new" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/architecture/architectures/draft-new");
    });
  });

  it("retains existing drafts when start-new fails", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([draftEntry()]);
    initializeArchitectureCreation.mockResolvedValue({ draftId: null });

    render(<ArchitectureCreationBootstrap />);

    fireEvent.click(await screen.findByTestId("architecture-creation-start-new"));

    expect(await screen.findByTestId("architecture-creation-bootstrap-error")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-creation-bootstrap-resume-choice")).toBeInTheDocument();
    expect(screen.getByText("Claims intake draft")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not navigate to a review route when creating or continuing a draft", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([draftEntry()]);
    initializeArchitectureCreation.mockResolvedValue({ draftId: "draft-new" });

    render(<ArchitectureCreationBootstrap />);

    expect(await screen.findByRole("link", { name: CONTINUE_DRAFT_LABEL })).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-001",
    );
    expect(screen.queryByRole("link", { name: /start review/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-creation-start-new"));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/architecture/architectures/draft-new");
    });

    expect(replace.mock.calls[0]?.[0]).not.toMatch(/\/architecture\/reviews\//);
  });

  it("recovers from a hung draft create instead of staying on Starting architecture…", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([]);
    initializeArchitectureCreation.mockImplementation(() => new Promise(() => undefined));

    render(<ArchitectureCreationBootstrap />);

    const startButton = await screen.findByTestId("architecture-creation-start-new");
    vi.useFakeTimers();
    fireEvent.click(startButton);
    expect(screen.getByTestId("architecture-creation-bootstrap-creating")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREATE_ARCHITECTURE_BOOTSTRAP_TIMEOUT_MS);
    });

    expect(screen.getByTestId("architecture-creation-bootstrap-error")).toHaveTextContent(
      CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE,
    );
    expect(screen.getByTestId("architecture-creation-bootstrap-ready")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
