import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

/** Reviews hub inventory filter query — unfinished / needs-attention reviews. */
export const REVIEWS_HUB_NEEDS_ATTENTION_FILTER = "needs-attention" as const;

export const REVIEWS_HUB_UNFINISHED_WORK_HREF =
  `${REVIEWS_LIST_PATH}?filter=${REVIEWS_HUB_NEEDS_ATTENTION_FILTER}` as const;
