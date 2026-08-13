import {
  getArtifactBusinessLabel,
  getArtifactTypeDescription,
  sponsorArtifactAudienceLine,
} from "@/lib/artifact-review-helpers";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

type PreviewArtifact = NonNullable<DemoCommitPagePreviewResponse["artifacts"]>[number];

const FALLBACK_DELIVERABLES = [
  {
    key: "sponsor-briefing",
    title: "Sponsor sponsor briefing",
    detail: "Board-ready summary of risk posture, decisions, and residual monitoring.",
  },
  {
    key: "cost-risk",
    title: "Cost and risk analysis",
    detail: "Cost posture sanity check paired with evidence-backed findings.",
  },
  {
    key: "adr",
    title: "Architecture decision record",
    detail: "Durable decisions with traceability for architect handoff.",
  },
  {
    key: "evidence-bundle",
    title: "Evidence bundle",
    detail: "Citations and snapshots that back every sponsor-facing claim.",
  },
  {
    key: "audit-package",
    title: "Audit package",
    detail: "Committed review metadata for who acted, when, and what changed.",
  },
] as const;

export type SeeItKeyDeliverablesProps = {
  readonly artifacts: readonly PreviewArtifact[];
};

function resolveArtifactDetail(artifactType: string): string {
  const audienceLine = sponsorArtifactAudienceLine(artifactType);

  if (audienceLine !== null && audienceLine.trim().length > 0) {
    return audienceLine;
  }

  return getArtifactTypeDescription(artifactType);
}


/**
 * Richer deliverable list for `/see-it` — payload artifacts when present, else a buyer-facing fallback set.
 */
export function SeeItKeyDeliverables(props: SeeItKeyDeliverablesProps): React.JSX.Element {
  const { artifacts } = props;
  const previewArtifacts = artifacts.slice(0, 5);

  return (
    <section data-testid="see-it-artifacts" className={MARKETING_SURFACES.cardComfort}>
      <h2 className={cn("m-0", MARKETING_TYPOGRAPHY.sectionTitle)}>Key deliverables (preview)</h2>
      <p className={cn("mt-2 m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        One package links sponsor briefing, findings, decisions, evidence, and audit metadata —
        not a disposable chat transcript.
      </p>

      {previewArtifacts.length > 0 ? (
        <ul className="mt-4 m-0 list-none space-y-3 p-0">
          {previewArtifacts.map((artifact) => (
            <li
              key={artifact.artifactId}
              className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/50"
            >
              <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                {getArtifactBusinessLabel(artifact.artifactType)}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                {resolveArtifactDetail(artifact.artifactType)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 m-0 list-none space-y-3 p-0" data-testid="see-it-no-artifacts">
          {FALLBACK_DELIVERABLES.map((item) => (
            <li
              key={item.key}
              className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/50"
            >
              <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                {item.title}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
