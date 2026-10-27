import {
  ARCHITECTURE_DIAGRAM_EVIDENCE_ITEM_ID_NOT_STORED_ON_COMPONENT,
  ARCHITECTURE_DIAGRAM_OPEN_SUBMITTED_EVIDENCE_LINK_LABEL,
  ARCHITECTURE_DIAGRAM_REVIEW_ID_NOT_STORED_EVIDENCE_LINK,
  type ArchitectureDiagramElementProvenanceDetail,
  type ArchitectureDiagramProvenanceClass,
} from "@/lib/architecture/architecture-diagram-provenance";

const OPEN_GENERIC_SOURCE_EVIDENCE_LABEL = "Open source evidence";
const INFERRED_NO_SOURCE_LINK_COPY = "Inferred items do not include a source evidence link.";

export type ArchitectureDiagramProvenanceSourceFollowUp =
  | {
      readonly kind: "source-link";
      readonly href: string;
      readonly linkLabel: string;
      readonly itemIdHonesty: string | null;
    }
  | {
      readonly kind: "missing-review-id";
      readonly text: string;
    }
  | {
      readonly kind: "inferred-no-link";
      readonly text: string;
    }
  | {
      readonly kind: "none";
    };

/** Former union member `evidence-backed` was renamed to `brief-asserted`. */
export function isBriefAssertedProvenanceClass(
  provenanceClass: ArchitectureDiagramProvenanceClass,
): boolean {
  return provenanceClass === "brief-asserted";
}

export function resolveArchitectureDiagramProvenanceSourceFollowUp(
  detail: Pick<ArchitectureDiagramElementProvenanceDetail, "provenanceClass" | "sourceHref"> & {
    readonly runId: string;
  },
): ArchitectureDiagramProvenanceSourceFollowUp {
  if (detail.sourceHref !== null) {
    return resolveSourceLinkFollowUp(detail.provenanceClass, detail.sourceHref);
  }

  return resolveMissingHrefFollowUp(detail.provenanceClass, detail.runId);
}

function resolveSourceLinkFollowUp(
  provenanceClass: ArchitectureDiagramProvenanceClass,
  href: string,
): ArchitectureDiagramProvenanceSourceFollowUp {
  const briefAsserted = isBriefAssertedProvenanceClass(provenanceClass);

  return {
    kind: "source-link",
    href,
    linkLabel: briefAsserted
      ? ARCHITECTURE_DIAGRAM_OPEN_SUBMITTED_EVIDENCE_LINK_LABEL
      : OPEN_GENERIC_SOURCE_EVIDENCE_LABEL,
    itemIdHonesty: briefAsserted ? ARCHITECTURE_DIAGRAM_EVIDENCE_ITEM_ID_NOT_STORED_ON_COMPONENT : null,
  };
}

function resolveMissingHrefFollowUp(
  provenanceClass: ArchitectureDiagramProvenanceClass,
  runId: string,
): ArchitectureDiagramProvenanceSourceFollowUp {
  switch (provenanceClass) {
    case "brief-asserted":
      if (runId.trim().length > 0) {
        return {
          kind: "missing-review-id",
          text: ARCHITECTURE_DIAGRAM_EVIDENCE_ITEM_ID_NOT_STORED_ON_COMPONENT,
        };
      }

      return {
        kind: "missing-review-id",
        text: ARCHITECTURE_DIAGRAM_REVIEW_ID_NOT_STORED_EVIDENCE_LINK,
      };
    case "inferred":
      return {
        kind: "inferred-no-link",
        text: INFERRED_NO_SOURCE_LINK_COPY,
      };
    case "accepted-inference":
    case "user-drawn":
      return { kind: "none" };
    default: {
      const exhaustive: never = provenanceClass;

      return exhaustive;
    }
  }
}
