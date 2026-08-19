import {
  SPONSOR_BRIEFING_EXPORT_LABEL,
  SPONSOR_BRIEFING_EXPORT_LABEL_LOWER,
} from "@/lib/usability/canonical-product-terms";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

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
  const runId = input.runId.trim();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showcaseSpine = input.buyerShowcaseQuickLinks;
  const optional: PostCommitHabitAction[] = [];

  const sponsorHref = `#sponsor-deliverables`;
  const trustEvidenceHref = `#trust-evidence`;
  const governanceHref = `/governance/approval-queue?runId=${encodeURIComponent(runId)}`;

  let primary: PostCommitHabitAction;

  if (buyerPolishedShell && showcaseSpine) {
    primary = {
      id: "sponsor-packet",
      kind: "primary",
      label: `Send ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER}`,
      href: sponsorHref,
      description: "Open sponsor deliverables — PDF, proof pack, and readiness checks.",
    };

    optional.push({
      id: "governance",
      kind: "optional",
      label: "View governance approval",
      href: governanceHref,
      description: "Optional governance posture after the sample review.",
    });
  }
  else if (buyerPolishedShell) {
    primary = {
      id: "sponsor-packet",
      kind: "primary",
      label: `Send ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER}`,
      href: sponsorHref,
      description: `Finalize ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER} before external circulation.`,
    };
  }
  else {
    primary = {
      id: "sponsor-packet",
      kind: "primary",
      label: `Send ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER}`,
      href: sponsorHref,
      description: `Download ${SPONSOR_BRIEFING_EXPORT_LABEL_LOWER} from the deliverables section.`,
    };
  }

  if (input.showCompareCta) {
    optional.push({
      id: "compare",
      kind: "optional",
      label: "Compare with prior review",
      href: comparePageHrefAdaptive(runId),
      description: "Contrast this finalized review with an earlier one.",
    });
  }

  if (hasManifest(input.manifestId)) {
    optional.push({
      id: "schedule-recurrence",
      kind: "optional",
      label: "Schedule recurring review",
      href: "#recurrence-schedule-post-commit-card",
      description: "Set a cadence so the next review clones this package automatically.",
    });

    optional.push({
      id: "evidence-chain",
      kind: "optional",
      label: "Open evidence chain",
      href: trustEvidenceHref,
      description: "Trace evidence → finding → review → artifact in one view.",
    });
  }

  optional.push({
    id: "value-delta",
    kind: "optional",
    label: "Review value delta on scorecard",
    href: "/insights/architecture-scorecard",
    description: "Compare cumulative tenant metrics and ROI baselines after finalize.",
  });

  optional.push({
    id: "second-review",
    kind: "optional",
    label: "Start another review",
    href: "/architecture/reviews/new",
    description: "Run a follow-up architecture review when the team is ready to compare outcomes.",
  });

  return { primary, optional };
}
