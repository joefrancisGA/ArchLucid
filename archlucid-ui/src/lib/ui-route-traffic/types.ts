/**
 * One row of the owner UI route traffic workbook master table, plus the honesty expectations the
 * consolidated drift test enforces for that row.
 *
 * Rows live here rather than in one module per route: nothing in the app reads them, so the family
 * existed only to pin `docs/architecture/ui_route_traffic_estimates.template.md`.
 */
export type UiRouteTrafficRow = {
  /** Master-table ID column (owner backlog shorthand, for example `GFN`). */
  readonly rowId: string;
  /** Canonical route path tracked on the row. Prefer a shared route constant over a literal. */
  readonly path: string;
  /** Master-table Section column value. */
  readonly section: string;
  /** Master-table Notes column value, verbatim. */
  readonly note: string;
  /** Phrases the note must keep, so an edit cannot quietly drop what the row documents. */
  readonly noteMustContain?: readonly string[];
  /** Phrases the note must not contain (case-sensitive). */
  readonly noteMustNotContain?: readonly string[];
  /** Phrases the note must not contain once lower-cased. */
  readonly noteMustNotContainLower?: readonly string[];
  /** Patterns the note must match, used for evidence-chrome claims. */
  readonly noteMustMatch?: readonly RegExp[];
  /** Section values this row must not regress to (case-sensitive). */
  readonly sectionMustNotEqual?: readonly string[];
  /** Section values this row must not regress to once lower-cased. */
  readonly sectionMustNotEqualLower?: readonly string[];
};
