export const ARCHITECTURE_DIAGRAM_SECTION_HEADING = "Architecture diagram" as const;

export const ARCHITECTURE_DIAGRAM_DRAFT_LABEL =
  "Generated from the information provided. Review inferred components and lines." as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_PROVENANCE_NOTE =
  "Counts list components and lines recorded in your brief versus inferred on this diagram." as const;

export const ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE =
  "Draft diagram — confirm or edit before treating this as authoritative." as const;

export const ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING = "A diagram could not be generated yet." as const;

export const ARCHITECTURE_DIAGRAM_INSUFFICIENT_ORIENTATION =
  "Clarify the missing architecture detail for this review in guided intake, then return here to regenerate the diagram." as const;

export const ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION = "Clarify architecture" as const;

export const ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION = "Add missing architecture details" as const;

export const ARCHITECTURE_DIAGRAM_GENERATE_ACTION = "Generate architecture diagram" as const;

export const ARCHITECTURE_DIAGRAM_REGENERATE_ACTION = "Regenerate" as const;

export const ARCHITECTURE_DIAGRAM_EDIT_ACTION = "Edit diagram" as const;

export const ARCHITECTURE_DIAGRAM_EDIT_MERMAID_ACTION = "Edit Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL = "Draft" as const;

export const ARCHITECTURE_DIAGRAM_PREVIEW_CLIPPED_LABEL = "Preview clipped — open Diagram tab for full view." as const;

export const ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION = "View Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE =
  "Technical diagram source for review or export — not the finalized architecture record." as const;

export const ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION = "Copy Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION = "Download diagram" as const;

export const ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION = "Fullscreen" as const;

export const ARCHITECTURE_DIAGRAM_RETRY_ACTION = "Retry" as const;

export const ARCHITECTURE_DIAGRAM_LOADING_LABEL = "Generating architecture diagram…" as const;

export const ARCHITECTURE_DIAGRAM_RENDER_FAILURE =
  "The architecture diagram could not be rendered. Edit the diagram or regenerate from your brief." as const;

export const ARCHITECTURE_DIAGRAM_PAINT_FAILURE =
  "This painted view is too large for the browser viewport. Switch diagram mode or export Mermaid — the diagram source was stored and did not fail to render." as const;

export const ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION = "Accept" as const;

export const ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION = "Remove" as const;

export const ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL = "Diagram versions saved on this device" as const;

export const ARCHITECTURE_DIAGRAM_VERSION_HISTORY_DISCLAIMER =
  "Local to this browser — not part of the audit trail." as const;

export const ARCHITECTURE_DIAGRAM_ACTIVE_VERSION_LABEL = "Active" as const;

export const ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE =
  "Could not save diagram version to this browser. Your edit is shown but may be lost on refresh." as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_HEADING = "Diagram legend" as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_ASSERTED =
  "Solid — asserted in your brief (accepted inferences are solid only after you accept them on this diagram)" as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_INFERRED =
  "Dashed — taken from submitted text, not operator-asserted; confirm or remove" as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_INFERRED_LINE =
  "Dashed connector — inferred relationship line, not operator-asserted; confirm or remove on the diagram" as const;

export const ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX =
  " (submitted text, not operator-asserted)" as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED = "Asserted" as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_INFERRED = "Inferred" as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ACCEPTED_INFERENCE = "Accepted inference" as const;

export const ARCHITECTURE_DIAGRAM_RESTORE_INFERRED_ACTION = "Restore" as const;

export const ARCHITECTURE_DIAGRAM_CANCEL_EDIT_ACTION = "Cancel" as const;

export const ARCHITECTURE_DIAGRAM_INVALID_MERMAID_ERROR =
  "Mermaid source must start with flowchart or graph." as const;

export const ARCHITECTURE_DIAGRAM_SAVE_ACTION = "Save diagram" as const;

export const ARCHITECTURE_DIAGRAM_REMOVED_INFERRED_HEADING = "Removed inferred components" as const;

export const ARCHITECTURE_DIAGRAM_INFERRED_REVIEW_HEADING = "Review inferred components" as const;

export const ARCHITECTURE_DIAGRAM_INFERRED_REVIEW_HELPER =
  "Inferred components are suggestions from your brief. Accepting one stores your confirmation; it is not observed infrastructure evidence." as const;

export const ARCHITECTURE_DIAGRAM_INFERRED_LOCKED_FOR_HAND_EDIT =
  "Inferred review is paused while a hand-edited Mermaid version is active. Regenerate or restore a generated version to accept or remove inferred components." as const;

export const ARCHITECTURE_DIAGRAM_MISSING_CATEGORY_LABELS = {
  "major-components": "major components",
  "external-systems": "external systems",
  "users-or-initiators": "users or initiating services",
  integrations: "integrations",
  "data-flows": "data flows",
  "trust-boundaries": "trust boundaries",
} as const;

/** Shared copy for architecture diagram viewport controls (SecureNow inventory + review detail). */

export const ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL = "Zoom in" as const;

export const ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL = "Zoom out" as const;

export const ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL = "Reset to 100%" as const;

export const ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL = "Diagram zoom percentage" as const;

export const ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL = "Fit in view" as const;

export const ARCHITECTURE_DIAGRAM_NEIGHBORHOOD_MAP_LABEL = "Neighborhood map" as const;

export const ARCHITECTURE_DIAGRAM_SUBSCRIPTION_NAME_NOT_STORED_ON_MAP =
  "Subscription name was not stored on this map." as const;

/** @deprecated Use {@link ARCHITECTURE_DIAGRAM_NEIGHBORHOOD_MAP_LABEL}. */
export const ARCHITECTURE_DIAGRAM_SUBSCRIPTION_MAP_LABEL = ARCHITECTURE_DIAGRAM_NEIGHBORHOOD_MAP_LABEL;

export const ARCHITECTURE_DIAGRAM_MAP_LABEL = "Map" as const;

export const ARCHITECTURE_DIAGRAM_PLATE_LABEL = "Full plate" as const;

export const ARCHITECTURE_DIAGRAM_VIEWPORT_HINT =
  "Focus the diagram, then Ctrl+scroll to zoom. + / − keys zoom. 0 or Fit in view resets to the fitted 100%." as const;

export const ARCHITECTURE_DIAGRAM_COMPONENT_NAME_NOT_STORED = "Component name was not stored." as const;

export const ARCHITECTURE_DIAGRAM_DATA_FLOW_NAME_NOT_STORED = "Flow name was not stored." as const;

export const ARCHITECTURE_DIAGRAM_SECTION_ENTITIES_NOT_STORED =
  "Entities were not stored." as const;

export const ARCHITECTURE_DIAGRAM_SECTION_ENTITIES_STORED_EMPTY =
  "Entities were stored empty." as const;

export const ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX =
  "Data flow was not matched to diagram components:" as const;

export const ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_NOT_STORED =
  "Flow detail was not stored." as const;

export const ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_STORED_EMPTY =
  "Flow detail was stored empty." as const;

export function formatArchitectureDiagramUnlabeledComponentsNotice(entityCount: number): string {
  const noun = entityCount === 1 ? "component" : "components";

  return `The diagram includes ${entityCount} ${noun} whose names were not stored.`;
}

export function formatTrustBoundaryWithoutMembershipNote(boundaryNames: readonly string[]): string {
  return `Trust boundary names were stored without component membership: ${boundaryNames.join(", ")}.`;
}

export const ARCHITECTURE_DIAGRAM_TRUST_BOUNDARY_NAME_NOT_STORED =
  "Trust boundary name was not stored." as const;

export const ARCHITECTURE_DIAGRAM_TRUST_BOUNDARY_NAME_STORED_EMPTY =
  "Trust boundary name was stored empty." as const;

export function formatTrustBoundaryDisplayLabel(label: string): string {
  if (label.length === 0) {
    return ARCHITECTURE_DIAGRAM_TRUST_BOUNDARY_NAME_NOT_STORED;
  }

  if (label.trim().length === 0) {
    return ARCHITECTURE_DIAGRAM_TRUST_BOUNDARY_NAME_STORED_EMPTY;
  }

  return label.trim();
}

export function formatReviewTitleNotCollectedSystemNote(reviewTitle: string): string {
  return `Review title: ${reviewTitle}. This title is not a collected system.`;
}

export function formatPeopleAndSystemsActorKindOmissionNote(actorLabel: string): string {
  const label = actorLabel.trim();

  return label.length > 0
    ? `People and systems: ${label} was not drawn because actor kind was not stored.`
    : "People and systems: Actor kind was not stored — not drawn on the diagram.";
}

export function formatUnmatchedArchitectureDataFlowLine(flow: string): string {
  return `${ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX} ${flow}`;
}

export function formatUnmatchedArchitectureDataFlowEntity(
  entity: { readonly label: string; readonly detail?: string | null },
): string {
  const flowText = entity.label.trim();

  if (flowText.length === 0) {
    const detailSuffix =
      entity.detail === null || entity.detail === undefined
        ? ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_NOT_STORED
        : entity.detail.trim().length === 0
          ? ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_STORED_EMPTY
          : ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_NOT_STORED;

    return `${ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX} ${ARCHITECTURE_DIAGRAM_DATA_FLOW_NAME_NOT_STORED} (${detailSuffix})`;
  }

  if (entity.detail === null || entity.detail === undefined) {
    return `${ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX} ${flowText} (${ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_NOT_STORED})`;
  }

  if (entity.detail.trim().length === 0) {
    return `${ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX} ${flowText} (${ARCHITECTURE_DIAGRAM_DATA_FLOW_DETAIL_STORED_EMPTY})`;
  }

  return formatUnmatchedArchitectureDataFlowLine(flowText);
}

export const ARCHITECTURE_DIAGRAM_NOT_GENERATED_MESSAGE =
  "Architecture diagram was not generated." as const;
