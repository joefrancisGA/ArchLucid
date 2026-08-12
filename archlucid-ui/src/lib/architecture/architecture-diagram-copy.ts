export const ARCHITECTURE_DIAGRAM_SECTION_HEADING = "Architecture diagram" as const;

export const ARCHITECTURE_DIAGRAM_DRAFT_LABEL =
  "Generated from the information provided. Review inferred components and connections." as const;

export const ARCHITECTURE_DIAGRAM_NOT_AUTHORITATIVE =
  "Draft diagram — confirm or edit before treating this as authoritative." as const;

export const ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING = "A diagram could not be generated yet." as const;

export const ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION = "Add missing architecture details" as const;

export const ARCHITECTURE_DIAGRAM_GENERATE_ACTION = "Generate architecture diagram" as const;

export const ARCHITECTURE_DIAGRAM_REGENERATE_ACTION = "Regenerate" as const;

export const ARCHITECTURE_DIAGRAM_EDIT_ACTION = "Edit diagram" as const;

export const ARCHITECTURE_DIAGRAM_EDIT_MERMAID_ACTION = "Edit Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL = "Draft" as const;

export const ARCHITECTURE_DIAGRAM_PREVIEW_CLIPPED_LABEL = "Preview clipped — open Diagram tab for full view." as const;

export const ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION = "View Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_DISCLOSURE =
  "Technical diagram source for review or export — not the signed architecture record." as const;

export const ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION = "Copy Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION = "Download diagram" as const;

export const ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION = "Full screen" as const;

export const ARCHITECTURE_DIAGRAM_RETRY_ACTION = "Retry" as const;

export const ARCHITECTURE_DIAGRAM_LOADING_LABEL = "Generating architecture diagram…" as const;

export const ARCHITECTURE_DIAGRAM_RENDER_FAILURE =
  "The architecture diagram could not be rendered. Edit the diagram or regenerate from your brief." as const;

export const ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION = "Accept" as const;

export const ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION = "Remove" as const;

export const ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL = "Diagram versions saved on this device" as const;

export const ARCHITECTURE_DIAGRAM_VERSION_HISTORY_DISCLAIMER =
  "Local to this browser — not part of the audit trail." as const;

export const ARCHITECTURE_DIAGRAM_ACTIVE_VERSION_LABEL = "Active" as const;

export const ARCHITECTURE_DIAGRAM_STORAGE_WRITE_FAILURE =
  "Could not save diagram version to this browser. Your edit is shown but may be lost on refresh." as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_HEADING = "Diagram legend" as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_ASSERTED = "Solid — asserted in your brief" as const;

export const ARCHITECTURE_DIAGRAM_LEGEND_INFERRED = "Dashed — inferred; confirm or remove" as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED = "Asserted" as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_INFERRED = "Inferred" as const;

export const ARCHITECTURE_DIAGRAM_RESTORE_INFERRED_ACTION = "Restore" as const;

export const ARCHITECTURE_DIAGRAM_CANCEL_EDIT_ACTION = "Cancel" as const;

export const ARCHITECTURE_DIAGRAM_INVALID_MERMAID_ERROR =
  "Mermaid source must start with flowchart or graph." as const;

export const ARCHITECTURE_DIAGRAM_SAVE_ACTION = "Save diagram" as const;

export const ARCHITECTURE_DIAGRAM_REMOVED_INFERRED_HEADING = "Removed inferred components" as const;

export const ARCHITECTURE_DIAGRAM_INFERRED_REVIEW_HEADING = "Review inferred components" as const;

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

export const ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL = "Zoom in" as const;

export const ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL = "Zoom out" as const;

export const ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL = "Reset zoom" as const;
