export const INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING = "Diagram legend";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED = "Solid — observed in Azure inventory";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED =
  "Dashed — declared (human assertion; not an ARM fact)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE =
  "Dashed — probable authorization or declared wiring (RBAC / ADF; not runtime traffic)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED =
  "Dotted — inferred hostname or AI inference (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE =
  "Likely connected to edges may require Tier 1 -IncludeAppSettingsHosts or other ARM sources.";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_COLUMN = "Source";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_DECLARED = "Declared";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_OBSERVED = "Observed";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_PROBABLE = "Probable";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_INFERRED = "Inferred";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_TITLE = "Connection evidence";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AUTHORIZATION_HINT =
  "Authorization from managed identity and RBAC — does not prove runtime traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_HOSTNAME_HINT =
  "Hostname match in app settings — confirm in application configuration.";

export const INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_TITLE = "Declared connection";

export const INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_OPEN_WORKBENCH = "Open declared connections";

export const INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_NOT_FOUND =
  "This declaration is no longer active or could not be loaded from the workbench list.";
