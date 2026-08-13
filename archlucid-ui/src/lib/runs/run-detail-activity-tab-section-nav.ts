import type { ProvenanceSection } from "@/components/provenance/ProvenanceSectionNav";

export type BuildRunDetailActivityTabSectionsArgs = {
  readonly buyerPolishedArtifactTable: boolean;
  readonly authorityChainLabel?: string;
  /** When set, includes TB-2200 post-finalize package changes anchor. */
  readonly hasManifestId?: boolean;
};

/** Anchor targets on the committed review workspace Activity tab (`reviewTab=activity`). */
export function buildRunDetailActivityTabSections(
  args: BuildRunDetailActivityTabSectionsArgs,
): ProvenanceSection[] {
  const sections: ProvenanceSection[] = [
    { id: "pipeline-timeline", label: "Recent lifecycle events" },
    { id: "pipeline-stages", label: "Review progress" },
  ];

  if (args.hasManifestId === true) {
    sections.push({ id: "package-changes-since-finalize", label: "What changed since finalize" });
  }

  const authorityChainLabel = args.authorityChainLabel?.trim() ?? "";

  if (authorityChainLabel.length > 0) {
    sections.push({ id: "authority-chain", label: authorityChainLabel });
  }

  if (!args.buyerPolishedArtifactTable) {
    sections.push({ id: "agent-forensics", label: "Diagnostics" });
  }

  return sections;
}
