import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const runsListBuyerPolishedForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () =>
      runsListBuyerPolishedForced.on === true ? true : actual.isBuyerPolishedOperatorShellEnv(),
  };
});

import { RunsListClient } from "./RunsListClient";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import type { RunSummary } from "@/types/authority";

afterEach(() => {
  runsListBuyerPolishedForced.on = false;
});

const sampleRun: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000099",
  projectId: "default",
  description: "Demo",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: false,
  hasFindingsSnapshot: true,
  hasGoldenManifest: false,
};

describe("RunsListClient inspector", () => {
  it("collapses showcase alias + canonical rows into one table row (unique data-testid)", () => {
    const aliasRun: RunSummary = {
      runId: "claims-intake-modernization-run",
      projectId: "default",
      description: "Claims Intake Modernization",
      createdUtc: "2026-01-10T14:15:22.000Z",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const canonicalRun: RunSummary = {
      ...aliasRun,
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    };

    render(
      <RunsListClient runs={[aliasRun, canonicalRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );

    expect(screen.getAllByTestId(`runs-row-${SHOWCASE_STATIC_DEMO_RUN_ID}`)).toHaveLength(1);
  });

  it("keeps the inspector empty until a row is selected", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );

    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();

    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));

    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
  });

  it("opens inspector preview when a row is clicked (not the Open review link)", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    const preview = screen.getByTestId("run-inspector-preview");
    expect(preview).toBeInTheDocument();
    fireEvent.click(within(preview).getByRole("button", { name: /technical details \(ids\)/i }));
    expect(within(preview).getByText("Workspace")).toBeInTheDocument();
  });

  it("closes inspector when X is clicked", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("inspector-panel-close"));
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
  });

  it("closes inspector on Escape after selection", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
  });

  it("shows work-queue section for needs-attention runs", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    expect(screen.getByRole("heading", { name: /needs attention/i })).toBeInTheDocument();
    expect(within(screen.getByTestId(`runs-row-${sampleRun.runId}`)).getByTestId("run-provenance-inline")).toBeInTheDocument();
  });

  it("renders primary title as Untitled review when description is empty", () => {
    const untitled: RunSummary = {
      ...sampleRun,
      description: "   ",
    };
    render(<RunsListClient runs={[untitled]} projectId="default" page={1} pageSize={20} totalCount={1} />);
    expect(within(screen.getByTestId(`runs-row-${untitled.runId}`)).getByText("Untitled review")).toBeInTheDocument();
  });

  it("partitions multiple runs into ordered queue sections", () => {
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-000000000001",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const inProgress: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-000000000002",
      hasFindingsSnapshot: false,
      hasGoldenManifest: false,
      hasGraphSnapshot: true,
    };

    render(
      <RunsListClient runs={[committed, sampleRun, inProgress]} projectId="default" page={1} pageSize={20} totalCount={3} />,
    );

    expect(screen.getByRole("heading", { name: /needs attention/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^in progress$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^finalized$/i })).toBeInTheDocument();
  });

  it("shows Set as baseline menu only for committed runs", () => {
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000aa",
      hasGoldenManifest: true,
    };

    render(<RunsListClient runs={[sampleRun, committed]} projectId="default" page={1} pageSize={20} totalCount={2} />);

    expect(screen.queryByTestId(`runs-row-baseline-menu-${sampleRun.runId}`)).toBeNull();
    expect(screen.getByTestId(`runs-row-baseline-menu-${committed.runId}`)).toBeInTheDocument();
  });

  it("buyer-polished: uses finalized section heading and scope chips", () => {
    runsListBuyerPolishedForced.on = true;

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const committed2: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cf",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    render(
      <RunsListClient runs={[committed, committed2]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    expect(screen.getByRole("heading", { name: /finalized review packages/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^finalized packages$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Search reviews by title or description/i)).toBeInTheDocument();
  });

  it("buyer-polished: hides list filters when exactly one review exists", () => {
    runsListBuyerPolishedForced.on = true;

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    render(<RunsListClient runs={[committed]} projectId="default" page={1} pageSize={20} totalCount={1} />);

    expect(screen.queryByLabelText(/Search reviews by title or description/i)).toBeNull();
  });

  it("buyer-polished: finalized scope hides in-flight runs", () => {
    runsListBuyerPolishedForced.on = true;

    const inFlight: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000dd",
    };
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000ee",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    render(
      <RunsListClient runs={[inFlight, committed]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    expect(screen.getByTestId(`runs-row-${inFlight.runId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`runs-row-${committed.runId}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^finalized packages$/i }));

    expect(screen.queryByTestId(`runs-row-${inFlight.runId}`)).toBeNull();
    expect(screen.getByTestId(`runs-row-${committed.runId}`)).toBeInTheDocument();
  });
});
