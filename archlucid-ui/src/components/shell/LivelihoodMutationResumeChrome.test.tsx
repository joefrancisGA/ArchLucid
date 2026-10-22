import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LivelihoodMutationResumeChrome } from "@/components/shell/LivelihoodMutationResumeChrome";
import { resolveLivelihoodMutationResumePresentation } from "@/lib/auth/livelihood-mutation-resume-copy";

describe("LivelihoodMutationResumeChrome (LW-098 / TB-2155)", () => {
  it("renders recovery contract markers when replay fails", () => {
    const pending = {
      kind: "architecture_draft_patch" as const,
      idempotencyKey: "77777777-7777-4777-8777-777777777777",
      returnPath: "/architecture/drafts/draft-1",
      savedAtUtc: "2026-09-10T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        draftId: "draft-1",
        body: { expectedUpdatedUtc: "2026-09-10T12:00:00.000Z" },
      },
    };

    render(
      <LivelihoodMutationResumeChrome
        isReplaying={false}
        onConfirm={vi.fn()}
        onDiscard={vi.fn()}
        presentation={resolveLivelihoodMutationResumePresentation(pending)}
        replayErrorMessage="Conflict — draft version moved on the server."
      />,
    );

    expect(screen.getByTestId("livelihood-mutation-resume-failure")).toHaveTextContent(/Conflict/i);
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-intact")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-next-step")).toBeInTheDocument();
  });

  it("keeps confirm actions available after a failed replay", () => {
    const pending = {
      kind: "architecture_draft_patch" as const,
      idempotencyKey: "88888888-8888-4888-8888-888888888888",
      returnPath: "/architecture/drafts/draft-1",
      savedAtUtc: "2026-09-10T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        draftId: "draft-1",
        body: { expectedUpdatedUtc: "2026-09-10T12:00:00.000Z" },
      },
    };

    const onConfirm = vi.fn();

    render(
      <LivelihoodMutationResumeChrome
        isReplaying={false}
        onConfirm={onConfirm}
        onDiscard={vi.fn()}
        presentation={resolveLivelihoodMutationResumePresentation(pending)}
        replayErrorMessage="Server error"
      />,
    );

    fireEvent.click(screen.getByTestId("livelihood-mutation-resume-confirm-button"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
