import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import {
  SPONSOR_BRIEFING_EXPORT_LABEL,
  SPONSOR_BRIEFING_EXPORT_LABEL_LOWER,
} from "@/lib/usability/canonical-product-terms";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";

export type ReviewLifecycleNextActionSurface = "post-commit-habit-loop" | "review-package" | "operator-home";

export type ReviewLifecycleNextActionPhase = "post-finalize" | "in-review";

export type ReviewLifecycleNextActionKind = "primary" | "optional";

export type ReviewLifecycleNextActionId =
  | "sponsor-packet"
  | "governance"
  | "compare"
  | "validate-replay"
  | "schedule-recurrence"
  | "evidence-chain"
  | "value-delta"
  | "second-review"
  | "triage-findings"
  | "add-evidence"
  | "answer-clarifications";

export type ReviewLifecycleNextActionDefinition = {
  readonly id: ReviewLifecycleNextActionId;
  readonly kind: ReviewLifecycleNextActionKind;
  readonly label: string;
  readonly description: string;
  readonly surfaces: readonly ReviewLifecycleNextActionSurface[];
  readonly phases: readonly ReviewLifecycleNextActionPhase[];
};

/** TB-2361 optional trims enforced centrally for post-commit habit loop consumers. */
export const POST_COMMIT_OPTIONAL_ACTION_IDS: readonly ReviewLifecycleNextActionId[] = [
  "compare",
  "schedule-recurrence",
  "evidence-chain",
  "value-delta",
  "second-review",
  "governance",
] as const;

const BANNED_POST_COMMIT_OPTIONAL_ACTION_IDS = new Set<ReviewLifecycleNextActionId>([
  "governance",
]);

export const REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY: readonly ReviewLifecycleNextActionDefinition[] = [
  {
    id: "sponsor-packet",
    kind: "primary",
    label: `Send ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER}`,
    description: `Download ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER} from the deliverables section.`,
    surfaces: ["post-commit-habit-loop", "review-package", "operator-home"],
    phases: ["post-finalize"],
  },
  {
    id: "governance",
    kind: "optional",
    label: "View resolve outcomes",
    description: "Optional approval workflow after the sample review.",
    surfaces: ["post-commit-habit-loop"],
    phases: ["post-finalize"],
  },
  {
    id: "compare",
    kind: "optional",
    label: "Compare with prior review",
    description: "Contrast this finalized review with an earlier one.",
    surfaces: ["post-commit-habit-loop", "review-package", "operator-home"],
    phases: ["post-finalize"],
  },
  {
    id: "validate-replay",
    kind: "optional",
    label: "Validate replay",
    description: "Re-check a single finalized architecture package.",
    surfaces: ["operator-home"],
    phases: ["post-finalize"],
  },
  {
    id: "schedule-recurrence",
    kind: "optional",
    label: "Schedule recurring review",
    description: "Set a cadence so the next review clones this package automatically.",
    surfaces: ["post-commit-habit-loop", "review-package"],
    phases: ["post-finalize"],
  },
  {
    id: "evidence-chain",
    kind: "optional",
    label: "Open evidence chain",
    description: "Trace evidence → finding → review → artifact in one view.",
    surfaces: ["post-commit-habit-loop"],
    phases: ["post-finalize"],
  },
  {
    id: "value-delta",
    kind: "optional",
    label: "Review value delta on scorecard",
    description: "Compare cumulative tenant metrics and ROI baselines after finalize.",
    surfaces: ["post-commit-habit-loop", "operator-home"],
    phases: ["post-finalize"],
  },
  {
    id: "second-review",
    kind: "optional",
    label: "Start another review",
    description: "Run a follow-up architecture review when the team is ready to compare outcomes.",
    surfaces: ["post-commit-habit-loop", "operator-home", "review-package"],
    phases: ["post-finalize", "in-review"],
  },
  {
    id: "triage-findings",
    kind: "primary",
    label: "Review findings",
    description: "Resolve open findings before you finalize or share with leadership.",
    surfaces: ["review-package"],
    phases: ["in-review"],
  },
  {
    id: "add-evidence",
    kind: "primary",
    label: "Add evidence",
    description: "Add architecture evidence before expecting full findings.",
    surfaces: ["review-package"],
    phases: ["in-review"],
  },
  {
    id: "answer-clarifications",
    kind: "primary",
    label: "Answer clarifying questions",
    description: "Answer open clarifying questions before assessment confidence improves.",
    surfaces: ["review-package"],
    phases: ["in-review"],
  },
] as const;

export type BuildReviewLifecycleNextActionHrefInput = {
  readonly runId: string;
  readonly showCompareCta?: boolean;
  readonly hasManifest?: boolean;
  readonly buyerShowcaseQuickLinks?: boolean;
  readonly correctionHref?: string | null;
};

export type ReviewLifecycleNextActionInstance = {
  readonly id: ReviewLifecycleNextActionId;
  readonly kind: ReviewLifecycleNextActionKind;
  readonly label: string;
  readonly href: string;
  readonly description: string;
};

function registryEntry(id: ReviewLifecycleNextActionId): ReviewLifecycleNextActionDefinition {
  const entry = REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY.find((row) => row.id === id);

  if (entry === undefined) {
    throw new Error(`Unknown review lifecycle next action id: ${id}`);
  }

  return entry;
}

function resolveHref(id: ReviewLifecycleNextActionId, input: BuildReviewLifecycleNextActionHrefInput): string | null {
  const runId = input.runId.trim();

  switch (id) {
    case "sponsor-packet":
      return "#sponsor-deliverables";

    case "governance":
      return `/governance/approval-queue?runId=${encodeURIComponent(runId)}`;

    case "compare":
      if (input.showCompareCta !== true) {
        return null;
      }

      return comparePageHrefAdaptive(runId);

    case "validate-replay":
      return `${INTERNAL_REPLAY_PATH}?runId=${encodeURIComponent(runId)}`;

    case "schedule-recurrence":
      if (input.hasManifest !== true) {
        return null;
      }

      return "#recurrence-schedule-post-commit-card";

    case "evidence-chain":
      if (input.hasManifest !== true) {
        return null;
      }

      return "#trust-evidence";

    case "value-delta":
      return "/insights/architecture-scorecard";

    case "second-review":
      return "/architecture/reviews/new";

    case "triage-findings":
      return buildReviewWorkspaceTabHref(runId, "findings");

    case "add-evidence":
      return buildReviewWorkspaceTabHref(runId, "evidence");

    case "answer-clarifications": {
      const correctionHref = input.correctionHref?.trim() ?? "";

      if (correctionHref.length > 0) {
        return correctionHref;
      }

      return buildReviewWorkspaceTabHref(runId, "overview");
    }

    default: {
      const unreachable: never = id;
      throw new Error(`Unhandled next action id ${unreachable}.`);
    }
  }
}

export function listReviewLifecycleNextActions(input: {
  readonly surface: ReviewLifecycleNextActionSurface;
  readonly phase: ReviewLifecycleNextActionPhase;
  readonly hrefInput: BuildReviewLifecycleNextActionHrefInput;
  readonly optionalActionIds?: readonly ReviewLifecycleNextActionId[];
}): {
  readonly primary: ReviewLifecycleNextActionInstance | null;
  readonly optional: readonly ReviewLifecycleNextActionInstance[];
} {
  const optionalIds = input.optionalActionIds ?? POST_COMMIT_OPTIONAL_ACTION_IDS;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const entries = REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY.filter(
    (entry) => entry.surfaces.includes(input.surface) && entry.phases.includes(input.phase),
  );

  let primary: ReviewLifecycleNextActionInstance | null = null;
  const optional: ReviewLifecycleNextActionInstance[] = [];

  for (const entry of entries) {
    const href = resolveHref(entry.id, input.hrefInput);

    if (href === null) {
      continue;
    }

    const instance: ReviewLifecycleNextActionInstance = {
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
      href,
      description: entry.description,
    };

    if (entry.kind === "primary" && primary === null) {
      if (buyerPolishedShell && entry.id === "sponsor-packet") {
        primary = {
          ...instance,
          label: `Send ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER}`,
          description:
            input.hrefInput.buyerShowcaseQuickLinks === true
              ? "Open sponsor deliverables — PDF, proof pack, and readiness checks."
              : `Finalize ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER} before external circulation.`,
        };
      }
      else {
        primary = instance;
      }

      continue;
    }

    if (entry.kind !== "optional" || !optionalIds.includes(entry.id)) {
      continue;
    }

    if (BANNED_POST_COMMIT_OPTIONAL_ACTION_IDS.has(entry.id)) {
      continue;
    }

    optional.push(instance);
  }

  if (primary === null && input.surface === "post-commit-habit-loop") {
    const fallback = registryEntry("sponsor-packet");
    const href = resolveHref(fallback.id, input.hrefInput);

    if (href !== null) {
      primary = {
        id: fallback.id,
        kind: fallback.kind,
        label: fallback.label,
        href,
        description: fallback.description,
      };
    }
  }

  return { primary, optional };
}

export function reviewLifecycleNextActionLabel(id: ReviewLifecycleNextActionId): string {
  return registryEntry(id).label;
}

export function reviewLifecycleNextActionInstance(input: {
  readonly id: ReviewLifecycleNextActionId;
  readonly hrefInput: BuildReviewLifecycleNextActionHrefInput;
  readonly hrefOverride?: string | null;
}): ReviewLifecycleNextActionInstance | null {
  const entry = registryEntry(input.id);
  const href = input.hrefOverride?.trim() ?? resolveHref(entry.id, input.hrefInput);

  if (href === null || href.length === 0) {
    return null;
  }

  return {
    id: entry.id,
    kind: entry.kind,
    label: entry.label,
    href,
    description: entry.description,
  };
}

export const REVIEW_LIFECYCLE_SPONSOR_PACKET_LABEL = SPONSOR_BRIEFING_EXPORT_LABEL;
