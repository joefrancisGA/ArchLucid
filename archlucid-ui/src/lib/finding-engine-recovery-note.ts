/** Reads the optional additive coverage note, including from pre-regeneration client types. */
export function readFindingEngineRecoveryNote(summary: unknown): string | null {
  if (typeof summary !== "object" || summary === null || !("findingEngineRecoveryNote" in summary)) {
    return null;
  }
  const note = summary.findingEngineRecoveryNote;
  return typeof note === "string" && note.trim() ? note.trim() : null;
}
