/** Catalog load hard failure may still leave bundled packs on My packs — not total policy pack loss. */
export const POLICY_PACKS_CATALOG_LOAD_FAILURE_PARTIAL_CAPTURE_LINE =
  "Catalog read failed is not proof your workspace has no policy packs — bundled packs remain on My packs when the catalog slice fails." as const;