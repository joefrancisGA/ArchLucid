import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
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
  const governanceHref = `/governance?runId=${encodeURIComponent(runId)}`;
  const quoteToProofHref = resolveInAppDocHref("docs/go-to-market/QUOTE_TO_PROOF_PACKET.md");

  let primary: PostCommitHabitAction;

  if (buyerPolishedShell && showcaseSpine) {
    primary = {
      id: "sponsor-packet",
      kind: "primary",
      label: "Send sponsor packet",
      href: sponsorHref,
      description: "Open executive sponsor deliverables — PDF, proof pack, and readiness checks.",
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
      label: "Send sponsor packet",
      href: sponsorHref,
      description: "Finalize executive sponsor exports before external circulation.",
    };
  }
  else {
    primary = {
      id: "sponsor-packet",
      kind: "primary",
      label: "Send sponsor packet",
      href: sponsorHref,
      description: "Download sponsor PDF and proof pack from the deliverables section.",
    };
  }

  if (input.showCompareCta) {
    optional.push({
      id: "compare",
      kind: "optional",
      label: "Compare with prior review",
      href: comparePageHrefAdaptive(runId),
      description: "Contrast this committed package with an earlier review.",
    });
  }

  if (hasManifest(input.manifestId)) {
    optional.push({
      id: "evidence-chain",
      kind: "optional",
      label: "Open evidence chain",
      href: trustEvidenceHref,
      description: "Trace evidence → finding → manifest → artifact in one view.",
    });
  }

  optional.push({
    id: "governance-dry-run",
    kind: "optional",
    label: "Run governance dry-run",
    href: "/governance/policy-packs",
    description: "Optional pre-commit policy pack check when governance is in pilot scope.",
  });

  optional.push({
    id: "quote-to-proof",
    kind: "optional",
    label: "Collect quote-to-proof packet",
    href: quoteToProofHref,
    description: "Run collect-first-pilot-proof.ps1 and attach go-no-go artifacts for sales handoff.",
  });

  optional.push({
    id: "value-delta",
    kind: "optional",
    label: "Review value delta on scorecard",
    href: "/scorecard",
    description: "Compare cumulative tenant metrics and ROI baselines after this commit.",
  });

  optional.push({
    id: "governance-decision",
    kind: "optional",
    label: "Next governance decision",
    href: governanceHref,
    description: "Record or review the governance approval tied to this review when policy packs apply.",
  });

  optional.push({
    id: "open-findings",
    kind: "optional",
    label: "Review open findings",
    href: trustEvidenceHref,
    description: "Prioritize remediation before the next governance or sponsor cycle.",
  });

  optional.push({
    id: "second-review",
    kind: "optional",
    label: "Start another review",
    href: "/reviews/new",
    description: "Run a second architecture review when the team is ready for compare and value delta.",
  });

  return { primary, optional };
}
