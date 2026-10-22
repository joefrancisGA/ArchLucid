/**
 * Source of truth for post-connect cloud inventory next-step coaching (TB-2222).
 * Replaces idle "no collection activity" dead-ends with attach -> start review guidance.
 */

import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";

export type CloudFirstInventoryCoachPhase = "empty" | "post-connect" | "post-pull";

export type CloudFirstInventoryCoachInput = {
  readonly hasConnection: boolean;
  /** True when at least one connection reports a successful pull/validation collection. */
  readonly hasSuccessfulPull: boolean;
  readonly connectedProviderCount?: number;
  readonly totalProviderCount?: number;
  /** Preferred provider when nothing is connected (must match visible platform scope). */
  readonly recommendedProviderId?: CloudProviderId;
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
  /** Null on empty — hub cards and provider Connection details already expose configure actions. */
  readonly primaryCtaLabel: string | null;
  readonly primaryCtaHref: string | null;
  /** When true, prefer this coach over idle empty-state copy. */
  readonly replacesIdleEmpty: boolean;
};

export const CLOUD_FIRST_INVENTORY_COACH_TITLE = "Next: attach inventory and start a review" as const;

export const CLOUD_FIRST_INVENTORY_COACH_EMPTY_TITLE = "No cloud providers connected yet" as const;

export const CLOUD_FIRST_INVENTORY_START_REVIEW_HREF = "/architecture/reviews/new" as const;

const EMPTY_COACH_PROVIDER_LABEL: Readonly<Record<CloudProviderId, string>> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

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
  const connectedProviderCount = input.connectedProviderCount ?? (input.hasConnection ? 1 : 0);
  const totalProviderCount = input.totalProviderCount ?? CLOUD_PROVIDER_NEUTRAL_ORDER.length;

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
    case "empty": {
      const recommendedProviderId = input.recommendedProviderId;

      if (recommendedProviderId !== undefined) {
        const providerLabel = EMPTY_COACH_PROVIDER_LABEL[recommendedProviderId];

        return {
          phase,
          title: CLOUD_FIRST_INVENTORY_COACH_EMPTY_TITLE,
          body: `${providerLabel} is not connected yet. Complete Connection details on this page to attach read-only inventory to architecture reviews.`,
          steps: [],
          primaryCtaLabel: null,
          primaryCtaHref: null,
          replacesIdleEmpty: true,
        };
      }

      return {
        phase,
        title: CLOUD_FIRST_INVENTORY_COACH_EMPTY_TITLE,
        body: `${connectedProviderCount} of ${totalProviderCount} cloud providers connected. Connecting adds read-only inventory packages to architecture reviews; evidence-only upload works without cloud vendor access.`,
        steps: [],
        primaryCtaLabel: null,
        primaryCtaHref: null,
        replacesIdleEmpty: true,
      };
    }
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
