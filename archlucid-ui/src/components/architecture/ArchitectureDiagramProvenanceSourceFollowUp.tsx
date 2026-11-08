import Link from "next/link";

import { cn } from "@/lib/utils";

import type { ArchitectureDiagramProvenanceSourceFollowUp as FollowUp } from "@/lib/architecture/architecture-diagram-provenance-source-follow-up";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramProvenanceSourceFollowUpProps = {
  readonly followUp: FollowUp;
};

export function ArchitectureDiagramProvenanceSourceFollowUp(
  props: ArchitectureDiagramProvenanceSourceFollowUpProps,
): React.JSX.Element | null {
  const followUp = props.followUp;

  switch (followUp.kind) {
    case "source-link":
      return <SourceLinkFollowUp followUp={followUp} />;
    case "missing-review-id":
      return (
        <HelperCopy testId="architecture-diagram-provenance-missing-review-id">{followUp.text}</HelperCopy>
      );
    case "inferred-no-link":
      return <HelperCopy>{followUp.text}</HelperCopy>;
    case "none":
      return null;
    default: {
      const exhaustive: never = followUp;

      return exhaustive;
    }
  }
}

function SourceLinkFollowUp(props: {
  readonly followUp: Extract<FollowUp, { readonly kind: "source-link" }>;
}): React.JSX.Element {
  const followUp = props.followUp;

  return (
    <div className="space-y-1">
      {followUp.itemIdHonesty !== null ? (
        <HelperCopy testId="architecture-diagram-evidence-item-id-not-stored">{followUp.itemIdHonesty}</HelperCopy>
      ) : null}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          className={OPERATOR_LINK.inline}
          href={followUp.href}
          data-testid="architecture-diagram-provenance-source-link"
        >
          {followUp.linkLabel}
        </Link>
      </p>
    </div>
  );
}

function HelperCopy(props: { readonly children: string; readonly testId?: string }): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
    >
      {props.children}
    </p>
  );
}
