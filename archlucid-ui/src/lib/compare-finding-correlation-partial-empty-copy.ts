/** No correlation metadata can mean partial inventory on either compared review, not a clean zero. */
export const COMPARE_FINDING_CORRELATION_PARTIAL_EMPTY_LINE =
  "No correlation metadata does not prove the two reviews had zero shared findings when either side used a partial inventory snapshot." as const;