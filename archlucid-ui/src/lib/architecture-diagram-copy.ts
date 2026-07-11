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

export const ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION = "View Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION = "Copy Mermaid source" as const;

export const ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION = "Download diagram" as const;

export const ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION = "Full screen" as const;

export const ARCHITECTURE_DIAGRAM_RETRY_ACTION = "Retry" as const;

export const ARCHITECTURE_DIAGRAM_LOADING_LABEL = "Generating architecture diagram…" as const;

export const ARCHITECTURE_DIAGRAM_RENDER_FAILURE =
  "The architecture diagram could not be rendered. Edit the diagram or regenerate from your brief." as const;

export const ARCHITECTURE_DIAGRAM_INFERRED_NODE_LABEL = "Inferred" as const;

export const ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION = "Accept" as const;

export const ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION = "Remove" as const;

export const ARCHITECTURE_DIAGRAM_VERSION_HISTORY_LABEL = "Diagram version history" as const;

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
