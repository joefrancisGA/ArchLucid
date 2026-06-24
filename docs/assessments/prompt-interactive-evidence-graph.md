# Implementation Prompt: Interactive Evidence Graph Visualization

**Objective:**
The backend currently traces exactly which architecture components the LLM traversed to reach a conclusion, storing them in `GraphNodeIdsExamined`. The UI currently only renders these as a text list. This task is to build a rich, interactive visualizer using `reactflow` that highlights the specific subgraph of evidence for a given finding, significantly boosting principal architect trust by proving *why* the LLM flagged an issue.

**Context:**
- The repository already has `reactflow` (^11.11.4) installed in `archlucid-ui/package.json`.
- The `RunQueryController` and `GraphController` expose endpoints to retrieve the full `GraphSnapshot` or `CytoscapeInteractiveGraphResponse` for a run.
- `ExplainabilityTrace` (and its UI DTO equivalent) contains `graphNodeIdsExamined` (array of strings).

**Steps to Implement:**

### 1. Identify or Add the Graph Fetching Logic
*   Locate the existing frontend client for fetching the run's graph (e.g., `/v1/planning/runs/{runId}/graph` or the cytoscape interactive graph endpoint).
*   If a specific React Query hook or fetcher does not exist in `archlucid-ui/src/lib/api`, create one to fetch the graph nodes and edges for the given `runId`.

### 2. Create the `FindingEvidenceGraph` Component
*   Create a new component `archlucid-ui/src/components/findings/FindingEvidenceGraph.tsx` (or similar path).
*   Use `reactflow` to render the nodes and edges.
*   **Highlighting Logic:** 
    *   Compare the nodes in the full graph against the `graphNodeIdsExamined` array for the currently selected finding.
    *   *Approach A (Highlight in context):* Render the full graph, but dim/fade nodes that are not in `graphNodeIdsExamined`, and apply a strong highlight/stroke to the examined nodes.
    *   *Approach B (Subgraph only):* Filter the nodes and edges to *only* show those present in `graphNodeIdsExamined` (and the edges connecting them). Approach A is usually better for context, but B is safer for huge graphs. Pick the best approach based on typical graph sizes, or allow toggling.
*   Implement a simple layout. If `dagre` is available, use it for auto-layout; otherwise, use a basic force-directed or grid layout, or rely on any coordinates already provided by the backend snapshot.

### 3. Integrate into the Finding Details UI
*   Locate the UI component that displays finding details (e.g., `FindingDetailPanel` or the `ExplainabilityTrace` tab).
*   Replace or supplement the raw text list of "Examined Nodes" with the new `FindingEvidenceGraph` component.
*   Ensure it handles loading states and empty states gracefully (e.g., if `graphNodeIdsExamined` is empty, show a fallback message).

### 4. Final Polish and Rescoring
*   Verify the implementation locally using the Operator UI.
*   Update `docs/assessments/latest_20260623_1933.md`:
    *   Move "Interactive Evidence Graph Visualization" from "Tier 2 / V1.2" to "SHIPPED".
    *   Rescore `Differentiability` (+3) and `Traceability` (or similar qualities mentioned in the document).
    *   Add a delta table showing the improvements.

**Important Guidelines:**
*   Keep the `reactflow` styling consistent with the ArchLucid Carbon-inspired enterprise design system (neutral gray surfaces, teal accents for highlighted nodes).
*   Ensure the graph component is responsive and works within the existing split-pane or modal layouts of the finding detail view.
