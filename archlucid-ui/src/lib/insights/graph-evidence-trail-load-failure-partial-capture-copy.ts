/** Graph load hard failure may still leave other review evidence readable — not total loss of the sealed package. */
export const GRAPH_EVIDENCE_TRAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE =
  "Graph read failed is not proof this review package has no topology — open the review record and check partial capture recovery before treating this as a seal defect." as const;
