import {
  getArtifactBusinessLabel,
  sponsorArtifactAudienceLine,
  stripArtifactFilenameExtension,
} from "@/lib/artifact-review-helpers";
import {
  LIVE_DEMO_DELIVERABLES_HEADING,
  LIVE_DEMO_DELIVERABLES_SUPPORTING,
} from "@/lib/live-demo-page-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { cn } from "@/lib/utils";

type LiveDemoDeliverablesCompactProps = {
  readonly payload: DemoCommitPagePreviewResponse;
};

function deliverableAudience(artifactType: string): string {
  const audience = sponsorArtifactAudienceLine(artifactType);

  if (audience === null) {
    return "Architecture";
  }

  if (audience.toLowerCase().includes("sponsor")) {
    return "Sponsor";
  }

  if (audience.toLowerCase().includes("audit")) {
    return "Audit";
  }

  if (audience.toLowerCase().includes("governance")) {
    return "Governance";
  }

  return "Architecture";
}

export function LiveDemoDeliverablesCompact(props: LiveDemoDeliverablesCompactProps) {
  const artifacts = Array.isArray(props.payload.artifacts) ? props.payload.artifacts : [];

  if (artifacts.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-3"
      data-testid="live-demo-deliverables"
      aria-labelledby="live-demo-deliverables-heading"
    >
      <div>
        <h3
          id="live-demo-deliverables-heading"
          className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}
        >
          {LIVE_DEMO_DELIVERABLES_HEADING}
        </h3>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
          {LIVE_DEMO_DELIVERABLES_SUPPORTING}
        </p>
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {artifacts.map((artifact, index) => {
          const artifactKey =
            typeof artifact.artifactId === "string" && artifact.artifactId.trim().length > 0
              ? artifact.artifactId
              : `artifact-${index}`;
          const label = getArtifactBusinessLabel(artifact.artifactType);
          const description = sponsorArtifactAudienceLine(artifact.artifactType) ?? "Reusable deliverable from the finalized package.";

          return (
            <li
              key={artifactKey}
              className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
                {label}
              </p>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                Audience: {deliverableAudience(artifact.artifactType)}
              </p>
              <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{description}</p>
              {typeof artifact.name === "string" && artifact.name.trim().length > 0 ? (
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                  {stripArtifactFilenameExtension(artifact.name.trim())}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
