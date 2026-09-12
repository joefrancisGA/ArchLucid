/** MG-010 — fixture matrix: Working+Career default (CG-075 / WS-22). */
export const MODE_GRAVITY_FIXTURE_MATRIX_DOC_COMMENT = `MG-010 fixture matrix (production-desk-chrome.test.ts):
- Working + Career (default): eval chrome false, desk chrome true
- Working + Rehearsal: eval chrome false, rehearsal labeling required
- Guided + Simulator teaching: eval chrome true
- Working + demo/trial/static flags: eval chrome true (eval seats)` as const;

export type ModeGravityFixtureMatrixRow = {
  readonly label: string;
  readonly workspaceMode: "working" | "guided";
  readonly evalChrome: boolean;
  readonly notes: string;
};

export const MODE_GRAVITY_FIXTURE_MATRIX_ROWS: readonly ModeGravityFixtureMatrixRow[] = [
  {
    label: "Working+Career default",
    workspaceMode: "working",
    evalChrome: false,
    notes: "Production Working instrument",
  },
  {
    label: "Working+Rehearsal",
    workspaceMode: "working",
    evalChrome: false,
    notes: "Rehearsal labeling; not Career-complete",
  },
  {
    label: "Guided+Simulator",
    workspaceMode: "guided",
    evalChrome: true,
    notes: "Teaching product; no Career door",
  },
  {
    label: "Working+demo",
    workspaceMode: "working",
    evalChrome: true,
    notes: "Demo build — eval chrome allowed",
  },
];
