import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: (): { push: (path: string) => void } => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  commitArchitectureRun: vi.fn(),
}));

import { commitArchitectureRun } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";

import { CommitRunButton } from "./CommitRunButton";

const mockCommit = vi.mocked(commitArchitectureRun);

describe("CommitRunButton", () => {
  it("renders disabled message when already finalized", () => {
    render(<CommitRunButton runId="abc" disabled />);

    expect(screen.getByText(/already finalized/i)).toBeInTheDocument();
  });

  it("renders commit-blocked coverage message without primary finalize control", () => {
    render(
      <CommitRunButton
        runId="abc"
        disabled={false}
        commitBlockedReason="Finding coverage is commit-blocking. Failed engines: Security."
      />,
    );

    expect(screen.getByTestId("commit-blocked-finding-coverage")).toHaveTextContent("Security");
    expect(screen.queryByRole("button", { name: /^finalize review$/i })).not.toBeInTheDocument();
  });

  it("surfaces finalize tooltip on the primary control", () => {
    render(<CommitRunButton runId="x" disabled={false} />);

    expect(screen.getByRole("button", { name: /^finalize review$/i })).toHaveAttribute(
      "title",
      "Replay and comparison remain available after finalizing.",
    );
  });

  it("opens confirm dialog and calls commit on confirm", async () => {
    mockCommit.mockResolvedValue({});

    render(<CommitRunButton runId="run-1" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith("run-1", { notifySponsor: false });
    });
  });

  it("passes notifySponsor when the email checkbox is checked", async () => {
    mockCommit.mockResolvedValue({});

    render(<CommitRunButton runId="run-2" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");

    fireEvent.click(within(dialog).getByRole("checkbox", { name: /email tenant admin contact/i }));

    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith("run-2", { notifySponsor: true });
    });
  });

  it("surfaces governance blockExplanation when finalize returns 409", async () => {
    mockCommit.mockRejectedValue(
      new ApiRequestError("Commit blocked by governance policy.", {
        httpStatus: 409,
        correlationId: "cid-409",
        problem: {
          title: "Conflict",
          detail: "Commit blocked by governance policy.",
          blockExplanation: "Add a private endpoint before finalizing.",
        },
      }),
    );

    render(<CommitRunButton runId="run-blocked" disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /^finalize review$/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^finalize review$/i }));

    expect(await screen.findByTestId("commit-governance-block-explanation")).toHaveTextContent(
      "Add a private endpoint before finalizing.",
    );
  });
});
