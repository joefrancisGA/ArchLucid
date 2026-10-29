export const INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING = "Diagram legend";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_CONNECTOR_PROVENANCE_NOT_STORED =
  "Connector provenance was not stored for this diagram." as const;

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED =
  "Solid — stored Azure inventory relationship (not live traffic or reachability proof)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED =
  "Dashed — declared (human assertion; not an ARM fact)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE =
  "Dashed — probable authorization or declared wiring (RBAC / ADF; not runtime traffic)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP =
  "Dashed — probable authorization, declared wiring, or a Logic App API connection (not runtime traffic)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_PRIVATE_ENDPOINT_DNS =
  "Dashed — private network path is a DNS-joined private endpoint hop, not authorization and not observed traffic";

export const INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND =
  "Inventory of data platforms in this snapshot. Not a data-flow diagram.";

export const INFRA_EVIDENCE_DIAGRAM_BUSINESS_CONTINUITY_READING_LEGEND =
  "Lines are backup or replication items collected from the vault. Resources with no line have no collected protection item in this snapshot.";

export const INFRA_EVIDENCE_DIAGRAM_PNG_CONFIGURATION_RELATIONSHIP_NOTE =
  "Linked backends, capacity assignments, and diagnostic settings on this diagram are configuration. They are not observed traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_STATIC_SITE_BACKEND_HINT =
  "Static Web App linked backend in configuration. This is not observed traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_FABRIC_CAPACITY_HINT =
  "Fabric capacity workspace assignment. This is not observed query traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_DIAGNOSTIC_STORAGE_HINT =
  "Diagnostic setting names this storage account. Log delivery was not observed.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_LOGIC_APP_CONNECTION_HINT =
  "Logic App API connection reference. This is not a data pipeline and not observed traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_ROUTE_TABLE_ROUTE_HINT =
  "Route table next hop from configuration. This is not observed forwarding.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_WORKFLOW_ACTION_HINT =
  "Logic App workflow action target from configuration. This is not an observed run.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_OBSERVED_FACT_READER_HINT =
  "ObservedFact marks what inventory stored. It is not proof of live traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AKS_SERVICE_LB_HINT =
  "Kubernetes service load balancer in configuration. This is not observed traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_NSP_ASSOCIATION_HINT =
  "Network security perimeter association in configuration. This is not observed traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_NODE_POOL_HINT =
  "AKS node pool scale set in configuration. This is not observed traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AMPLS_SCOPED_RESOURCE_HINT =
  "Azure Monitor private link scope member in configuration. This is not observed traffic.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED =
  "Dotted — inferred hostname or AI inference (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME =
  "Dotted — inferred hostname (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS =
  "Dashed — named in app settings. This is not observed traffic.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI =
  "Dashed — named in app settings. This is not observed traffic. Dotted — AI inference (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN =
  "Dotted — inferred (inference source was not stored).";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI =
  "Dotted — AI inference (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI =
  "Dotted — inferred hostname or AI inference (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE =
  "Dotted — linked-service text was inferred (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_AND_AI =
  "Dotted — linked-service text was inferred or AI inference (confirm in configuration)";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE =
  "Dotted hostname edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_FOOTNOTE =
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE;

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_FOOTNOTE =
  "Dashed app-settings edges name a configured host. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI_FOOTNOTE =
  "Dashed app-settings and dotted AI inference edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI_FOOTNOTE =
  "Dotted AI inference edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI_FOOTNOTE =
  "Dotted hostname and AI inference edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_FOOTNOTE =
  "Dotted linked-service edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_AND_AI_FOOTNOTE =
  "Dotted linked-service and AI inference edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN_FOOTNOTE =
  "Dotted inferred edges are inferred. They are not observed connections.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_UNCLASSIFIED_PROVENANCE =
  "Provenance was not stored.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_PRIVATE_ENDPOINT =
  "Private endpoint access in inventory. This is not observed traffic.";

export const INFRA_EVIDENCE_DIAGRAM_PNG_DATA_ARCHITECTURE_INVENTORY_NOTE =
  "This diagram shows how data stores relate in inventory. It is not a data-movement map.";

export const INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE =
  "This diagram shows network placement in inventory. It does not prove reachability.";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_RESOURCE_CATEGORY = "Resource category";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE = "Compute";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_NETWORK = "Network";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_DATA = "Data";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_STORAGE = "Storage";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_IDENTITY = "Identity";

export const INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_OTHER = "Other — not a stored resource category.";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_COLUMN = "Source";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_DECLARED = "Declared";

export const INFRA_EVIDENCE_DIAGRAM_NEIGHBOR_ON_VIEW_ISOLATION_DISCLAIMER =
  "Diagram neighbors are adjacency on this layout, not network isolation." as const;

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_OBSERVED =
  "Observed (inventory stored; not live traffic)";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_PROBABLE = "Probable";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_INFERRED = "Inferred";

export const INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_NOT_STORED = "Not stored";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_TITLE = "Connection evidence";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AUTHORIZATION_HINT =
  "Authorization from managed identity and RBAC — does not prove runtime traffic.";

export const INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_HOSTNAME_HINT =
  "This host was read from app settings. It is not observed traffic.";

export const INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_TITLE = "Declared connection";

export const INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_OPEN_WORKBENCH = "Open declared connections";

export const INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_NOT_FOUND =
  "This declaration is no longer active or could not be loaded from the workbench list.";
