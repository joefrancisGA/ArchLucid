import Link from "next/link";

import { OPERATOR_LINK } from "@/lib/design-tokens";
import { provenanceReferenceHref } from "@/lib/provenance-reference-href";
import type { ArchitectureLinkageNode } from "@/types/architecture-provenance";

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

  if (href === null) {
    return <>{raw}</>;
  }

  return (
    <Link className={OPERATOR_LINK.inline} href={href}>
      {raw}
    </Link>
  );
}
