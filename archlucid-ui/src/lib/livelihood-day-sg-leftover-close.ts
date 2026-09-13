/** LY-021–040 close: reuse SG leftover tests; do not re-run SG-001–081 product bodies. */
export type LivelihoodDaySgLeftoverCloseRow = {
  readonly lyPrompt: string;
  readonly relativeTestPath: string;
  readonly marker: string;
};

export const LIVELIHOOD_DAY_SG_LEFTOVER_CLOSE_ROWS: readonly LivelihoodDaySgLeftoverCloseRow[] = [
  {
    lyPrompt: "LY-021",
    relativeTestPath: "lib/resolve-working-findings-instrument-href.test.ts",
    marker: "SG-019",
  },
  {
    lyPrompt: "LY-022",
    relativeTestPath: "lib/architecture/finalize-success-desk-href.test.ts",
    marker: "AO-35",
  },
  {
    lyPrompt: "LY-023",
    relativeTestPath: "lib/system-gravity-instrument-after-spawn-guard.test.ts",
    marker: "SG-106",
  },
];
