/** Canonical in-product anchors for procurement evidence map eval acceptance rows. */
export const PROCUREMENT_SN_EVAL_ANCHOR_PATH = "/administration/securenow-quote-packet" as const;

export const PROCUREMENT_SN_EVAL_ANCHOR_FRAGMENT = "sn-eval" as const;

export const PROCUREMENT_SN_EVAL_ANCHOR_HREF =
  `${PROCUREMENT_SN_EVAL_ANCHOR_PATH}#${PROCUREMENT_SN_EVAL_ANCHOR_FRAGMENT}` as const;

export const PROCUREMENT_SN_EVAL_ANCHOR_TEST_ID = "securenow-quote-packet-sn-eval" as const;

export const PROCUREMENT_AL_EVAL_ANCHOR_PATH = "/pricing" as const;

export const PROCUREMENT_AL_EVAL_ANCHOR_FRAGMENT = "al-eval-acceptance" as const;

export const PROCUREMENT_AL_EVAL_ANCHOR_HREF =
  `${PROCUREMENT_AL_EVAL_ANCHOR_PATH}#${PROCUREMENT_AL_EVAL_ANCHOR_FRAGMENT}` as const;

export const PROCUREMENT_AL_EVAL_ANCHOR_TEST_ID = "pricing-al-eval-acceptance" as const;

export type ProcurementEvidenceGuardedAnchor = {
  readonly rowId: string;
  readonly href: string;
  readonly path: string;
  readonly fragment: string;
  readonly testId: string;
};

export const PROCUREMENT_EVIDENCE_GUARDED_ANCHORS: readonly ProcurementEvidenceGuardedAnchor[] = [
  {
    rowId: "sn-eval-acceptance",
    href: PROCUREMENT_SN_EVAL_ANCHOR_HREF,
    path: PROCUREMENT_SN_EVAL_ANCHOR_PATH,
    fragment: PROCUREMENT_SN_EVAL_ANCHOR_FRAGMENT,
    testId: PROCUREMENT_SN_EVAL_ANCHOR_TEST_ID,
  },
  {
    rowId: "al-eval-acceptance",
    href: PROCUREMENT_AL_EVAL_ANCHOR_HREF,
    path: PROCUREMENT_AL_EVAL_ANCHOR_PATH,
    fragment: PROCUREMENT_AL_EVAL_ANCHOR_FRAGMENT,
    testId: PROCUREMENT_AL_EVAL_ANCHOR_TEST_ID,
  },
] as const;
