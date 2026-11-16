import { SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE } from "@/lib/product-line/securenow-partial-capture-honesty-copy";

/** Findings empty queue while capture succeeded with gaps. */
export const SECURENOW_FINDINGS_EMPTY_PARTIAL_CAPTURE_LINE =
  `This queue is empty for stored evaluation results. ${SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE}` as const;