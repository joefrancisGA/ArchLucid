import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { provenanceNodeDisplayName } from "@/lib/provenance-node-presentation";
import { provenanceReferenceHref } from "@/lib/provenance-reference-href";
import type { ArchitectureLinkageNode } from "@/types/architecture-provenance";

function resolveReferenceLabel(
  referenceId: string,
  nodes: readonly ArchitectureLinkageNode[],
): string {
  const byReference = nodes.find((node) => node.referenceId === referenceId);
  const byId = nodes.find((node) => node.id === referenceId);
  const node = byReference ?? byId;

  if (node !== undefined) {
    return provenanceNodeDisplayName(node);
  }

  return "Correlation reference — no linked record";
}

export function ProvenanceReferenceLink(props: {
  readonly runId: string;
  readonly referenceId: string | null | undefined;
  readonly nodes: readonly ArchitectureLinkageNode[];
}) {
  const { runId, referenceId, nodes } = props;
  const raw = referenceId?.trim() ?? "";

  if (raw.length === 0) {
    return <>—</>;
  }

  const href = provenanceReferenceHref(runId, raw, nodes);
  const label = resolveReferenceLabel(raw, nodes);

  if (href === null) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span>{label}</span>
        <code className={cn("break-all text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
          {raw}
        </code>
        <CopyIdButton value={raw} aria-label={`Copy reference for ${label}`} />
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Link className={OPERATOR_LINK.inline} href={href} aria-label={`${label}, reference ${raw}`}>
        {label}
      </Link>
      <code className={cn("break-all text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
        {raw}
      </code>
      <CopyIdButton value={raw} aria-label={`Copy reference for ${label}`} />
    </span>
  );
}
