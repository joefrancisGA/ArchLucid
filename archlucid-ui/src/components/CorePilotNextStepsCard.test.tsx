import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core-pilot-commit-context", () => ({
  fetchCorePilotCommitContext: vi.fn(),
}));

import { CorePilotNextStepsCard } from "@/components/CorePilotNextStepsCard";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";

const mockedFetchCorePilotCommitContext = vi.mocked(fetchCorePilotCommitContext);

describe("CorePilotNextStepsCard", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockedFetchCorePilotCommitContext.mockResolvedValue({
      hasCommittedManifest: false,
      latestRunId: null,
      firstCommittedRunId: null,
    });
  });

  describe("no-run state (first-time operator)", () => {
    it("shows Step 1 of 4 badge so the operator knows where they are", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("core-pilot-next-steps")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-step-badge")).toHaveTextContent("Step 1 of 4");
    });

    it("marks Create architecture request as the active step CTA", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-active-step-link")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-active-step-link")).toHaveAttribute("href", "/reviews/new");
      expect(screen.getByTestId("pilot-active-step-link")).toHaveTextContent(/create architecture request/i);
    });

    it("shows skip-for-now note naming advanced features", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-skip-for-now")).toBeInTheDocument();
      });

      const skipNote = screen.getByTestId("pilot-skip-for-now");

      expect(skipNote).toHaveTextContent(/compare/i);
      expect(skipNote).toHaveTextContent(/governance/i);
      expect(skipNote).toHaveTextContent(/ask/i);
    });

    it("shows rescue link to Help when blocked", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-rescue-link")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-rescue-link")).toHaveTextContent(/blocked/i);
      expect(screen.getByRole("link", { name: /^help$/i })).toHaveAttribute("href", "/help");
    });

    it("does not show operate links in first-time state", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("core-pilot-next-steps")).toBeInTheDocument();
      });

      expect(screen.queryByRole("link", { name: /open ask \(operate\)/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /workspace health/i })).not.toBeInTheDocument();
    });

    it("does not show a run ID when no run exists yet", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("core-pilot-next-steps")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("pilot-run-id")).not.toBeInTheDocument();
    });
  });

  describe("has-run state (pipeline in progress)", () => {
    beforeEach(() => {
      mockedFetchCorePilotCommitContext.mockResolvedValue({
        hasCommittedManifest: false,
        latestRunId: "run-abc-123",
        firstCommittedRunId: null,
      });
    });

    it("shows Step 2–3 of 4 badge", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-step-badge")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-step-badge")).toHaveTextContent("Step 2–3 of 4");
    });

    it("shows the run ID for support correlation", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-run-id")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-run-id")).toHaveTextContent("run-abc-123");
    });

    it("active step CTA links to the existing run detail", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-active-step-link")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-active-step-link")).toHaveAttribute("href", "/reviews/run-abc-123");
    });

    it("shows skip-for-now note", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-skip-for-now")).toBeInTheDocument();
      });
    });

    it("shows rescue link", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-rescue-link")).toBeInTheDocument();
      });
    });

    it("does not show operate links before commit", async () => {
      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("core-pilot-next-steps")).toBeInTheDocument();
      });

      expect(screen.queryByRole("link", { name: /open ask \(operate\)/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /workspace health/i })).not.toBeInTheDocument();
    });
  });

  describe("committed state", () => {
    it("shows Step 4 of 4 badge and Operate links as secondary", async () => {
      mockedFetchCorePilotCommitContext.mockResolvedValueOnce({
        hasCommittedManifest: true,
        latestRunId: "r1",
        firstCommittedRunId: "r1",
      });

      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("core-pilot-next-steps-complete")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-step-badge")).toHaveTextContent("Step 4 of 4");
      expect(screen.getByRole("link", { name: /workspace health \(sponsor view\)/i })).toHaveAttribute(
        "href",
        "/governance/dashboard",
      );
      expect(screen.getByRole("link", { name: /open ask \(operate\)/i })).toHaveAttribute("href", "/ask");
    });

    it("deeper Operate guidance is present but visually secondary (behind separator section)", async () => {
      mockedFetchCorePilotCommitContext.mockResolvedValueOnce({
        hasCommittedManifest: true,
        latestRunId: "r1",
        firstCommittedRunId: "r1",
      });

      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("core-pilot-next-steps-complete")).toBeInTheDocument();
      });

      // Operate links exist but are in the "Now available (optional)" secondary section.
      expect(screen.getByText(/now available \(optional\)/i)).toBeInTheDocument();

      const askLink = screen.getByRole("link", { name: /open ask \(operate\)/i });

      expect(askLink).toBeInTheDocument();
    });

    it("shows the committed run ID for support correlation", async () => {
      mockedFetchCorePilotCommitContext.mockResolvedValueOnce({
        hasCommittedManifest: true,
        latestRunId: "r1",
        firstCommittedRunId: "r1",
      });

      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByTestId("pilot-run-id")).toBeInTheDocument();
      });

      expect(screen.getByTestId("pilot-run-id")).toHaveTextContent("r1");
    });

    it("links review CTA to the committed run when available", async () => {
      mockedFetchCorePilotCommitContext.mockResolvedValueOnce({
        hasCommittedManifest: true,
        latestRunId: "r1",
        firstCommittedRunId: "r1",
      });

      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /open architecture review detail/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("link", { name: /open architecture review detail/i })).toHaveAttribute(
        "href",
        "/reviews/r1",
      );
    });

    it("falls back to reviews list when no firstCommittedRunId is available", async () => {
      mockedFetchCorePilotCommitContext.mockResolvedValueOnce({
        hasCommittedManifest: true,
        latestRunId: "r2",
        firstCommittedRunId: null,
      });

      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /open architecture review detail/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("link", { name: /open architecture review detail/i })).toHaveAttribute(
        "href",
        "/reviews?projectId=default",
      );
    });

    it("shows CLI support packet snippet", async () => {
      mockedFetchCorePilotCommitContext.mockResolvedValueOnce({
        hasCommittedManifest: true,
        latestRunId: "r1",
        firstCommittedRunId: "r1",
      });

      render(<CorePilotNextStepsCard />);

      await waitFor(() => {
        expect(screen.getAllByText(/run-support-packet/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
