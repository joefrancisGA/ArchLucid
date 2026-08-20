import {
  listReviewLifecycleNextActions,
  POST_COMMIT_OPTIONAL_ACTION_IDS,
} from "@/lib/review-lifecycle-next-action-registry";

export type PostCommitHabitActionKind = "primary" | "optional";

export type PostCommitHabitAction = {
  readonly id: string;
  readonly kind: PostCommitHabitActionKind;
  readonly label: string;
  readonly href: string;
  readonly description: string;
};

export type PostCommitHabitLoopInput = {
  readonly runId: string;
  readonly manifestId: string | null;
  readonly showCompareCta: boolean;
  readonly buyerShowcaseQuickLinks: boolean;
  readonly goldenManifestId: string | null;
};

export type PostCommitHabitLoop = {
  readonly primary: PostCommitHabitAction;
  readonly optional: readonly PostCommitHabitAction[];
};

function hasManifest(manifestId: string | null): boolean {
  return manifestId !== null && manifestId.trim().length > 0;
}

/**
 * One primary next action plus a short optional list after commit — aligned to FIRST_PILOT_OPERATOR_PATH Phase D/E.
 */
export function buildPostCommitHabitLoop(input: PostCommitHabitLoopInput): PostCommitHabitLoop {
  const actions = listReviewLifecycleNextActions({
    surface: "post-commit-habit-loop",
    phase: "post-finalize",
    optionalActionIds: POST_COMMIT_OPTIONAL_ACTION_IDS,
    hrefInput: {
      runId: input.runId,
      showCompareCta: input.showCompareCta,
      hasManifest: hasManifest(input.manifestId),
      buyerShowcaseQuickLinks: input.buyerShowcaseQuickLinks,
    },
  });

  if (actions.primary === null) {
    throw new Error("Post-commit habit loop requires a primary action.");
  }

  return {
    primary: actions.primary,
    optional: actions.optional,
  };
}

export { POST_COMMIT_OPTIONAL_ACTION_IDS };
