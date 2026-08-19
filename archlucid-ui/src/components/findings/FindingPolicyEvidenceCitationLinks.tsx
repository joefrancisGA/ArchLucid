import type { ReactElement } from "react";

import { FindingPolicyProvenancePanel } from "@/components/findings/FindingPolicyProvenancePanel";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/findings/finding-policy-evidence-citations";

export type FindingPolicyEvidenceCitationLinksProps = {
  readonly model: FindingPolicyEvidenceCitationModel;
  readonly compact?: boolean;
  readonly className?: string;
  readonly traceExcerpt?: string | null;
};

/** Surfaces explicit policy rule and evidence trail links for a finding. */
export function FindingPolicyEvidenceCitationLinks(props: FindingPolicyEvidenceCitationLinksProps): ReactElement | null {
  return (
    <FindingPolicyProvenancePanel
      model={props.model}
      compact={props.compact}
      className={props.className}
      traceExcerpt={props.traceExcerpt}
    />
  );
}
