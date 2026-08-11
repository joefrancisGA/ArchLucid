/**
 * Source of truth for post-connect cloud inventory next-step coaching (TB-2222).
 * Replaces idle "no collection activity" dead-ends with attach -> start review guidance.
 */

import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";

export type CloudFirstInventoryCoachPhase = "empty" | "post-connect" | "post-pull";

export type CloudFirstInventoryCoachInput = {
  readonly hasConnection: boolean;
  /** True when at least one connection reports a successful pull/validation collection. */
  readonly hasSuccessfulPull: boolean;
};

export type CloudFirstInventoryCoachStepId = "attach" | "start-review";

export type CloudFirstInventoryCoachStep = {
  readonly id: CloudFirstInventoryCoachStepId;
  readonly label: string;
};

export type CloudFirstInventoryCoachView = {
  readonly phase: CloudFirstInventoryCoachPhase;
  readonly title: string;
  readonly body: string;
  readonly steps: readonly CloudFirstInventoryCoachStep[];
  readonly primaryCtaLabel: string;
  readonly primaryCtaHref: string;
  /** When true, prefer this coach over idle empty-state copy. */
  readonly replacesIdleEmpty: boolean;
};

export const CLOUD_FIRST_INVENTORY_COACH_TITLE = "Next: attach inventory and start a review" as const;

export const CLOUD_FIRST_INVENTORY_START_REVIEW_HREF = "/architecture/reviews/new" as const;

export const CLOUD_FIRST_INVENTORY_COACH_STEPS: readonly CloudFirstInventoryCoachStep[] = [
  {
    id: "attach",
    label: "Attach the cloud inventory package on a new architecture review",
  },
  {
    id: "start-review",
    label: "Start the architecture review to produce findings and an evidence trail",
  },
] as const;

export function resolveCloudFirstInventoryCoachPhase(
  input: CloudFirstInventoryCoachInput,
): CloudFirstInventoryCoachPhase {
  if (input.hasSuccessfulPull) {
    return "post-pull";
  }

  if (input.hasConnection) {
    return "post-connect";
  }

  return "empty";
}

function buildView(
  phase: CloudFirstInventoryCoachPhase,
  body: string,
): CloudFirstInventoryCoachView {
  return {
    phase,
    title: CLOUD_FIRST_INVENTORY_COACH_TITLE,
    body,
    steps: CLOUD_FIRST_INVENTORY_COACH_STEPS,
    primaryCtaLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    primaryCtaHref: CLOUD_FIRST_INVENTORY_START_REVIEW_HREF,
    replacesIdleEmpty: true,
  };
}

/** Builds the attach -> start review coach for empty / post-connect / post-pull surfaces. */
export function buildCloudFirstInventoryCoach(
  input: CloudFirstInventoryCoachInput,
): CloudFirstInventoryCoachView {
  const phase = resolveCloudFirstInventoryCoachPhase(input);

  switch (phase) {
    case "post-pull":
      return buildView(
        phase,
        "Inventory is ready. Attach the package to an architecture review, then start the review - collection activity alone is not the goal.",
      );
    case "post-connect":
      return buildView(
        phase,
        "Your cloud connection is saved. After the first successful pull, attach the inventory package to a review and start the review - do not stop at an idle collection list.",
      );
    case "empty":
      return buildView(
        phase,
        "Connect a cloud provider and complete the first inventory pull, then attach that package and start an architecture review.",
      );
    default: {
      const _exhaustive: never = phase;

      return _exhaustive;
    }
  }
}

/** True when a connection row indicates a completed inventory pull/collection. */
export function cloudConnectionIndicatesSuccessfulPull(connection: {
  readonly lastPolledUtc?: string | null;
  readonly status?: string | null;
}): boolean {
  const polled = connection.lastPolledUtc?.trim() ?? "";

  if (polled.length > 0) {
    return true;
  }

  const status = connection.status?.trim().toLowerCase() ?? "";

  return status === "ready" || status === "active" || status === "succeeded" || status === "healthy";
}
