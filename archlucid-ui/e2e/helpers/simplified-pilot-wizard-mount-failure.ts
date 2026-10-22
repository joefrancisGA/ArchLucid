export type SimplifiedPilotWizardMountDiagnostic = {
  readonly pageUrl: string;
  readonly visibleShells: readonly string[];
  readonly stepOneRendered: boolean;
};

/**
 * Names a missing simplified pilot wizard so CI can separate it from a Reviews hub timeout.
 * The URL shows where Working mode actually landed, and step 1 distinguishes a mounted wizard from an empty shell.
 */
export function formatSimplifiedPilotWizardMountFailure(
  diagnostic: SimplifiedPilotWizardMountDiagnostic,
): string {
  const visibleShellSummary = diagnostic.visibleShells.length > 0 ? diagnostic.visibleShells.join(", ") : "none";
  const stepOneState = diagnostic.stepOneRendered ? "yes" : "no";

  return (
    `[simplified-pilot-wizard] Wizard did not mount. URL: ${diagnostic.pageUrl}. ` +
    `Visible shells: ${visibleShellSummary}. Step 1 rendered: ${stepOneState}.`
  );
}
