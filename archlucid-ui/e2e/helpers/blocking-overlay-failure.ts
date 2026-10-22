export type BlockingOverlayFailureDiagnostic = {
  readonly pageUrl: string;
  readonly overlayCount: number;
  readonly chooserVisible: boolean;
  readonly liveActionEnabled: boolean;
  readonly visibleDialogTestIds: readonly string[];
  readonly targetDescription: string;
};

export function formatBlockingOverlayFailure(diagnostic: BlockingOverlayFailureDiagnostic): string {
  const dialogSummary =
    diagnostic.visibleDialogTestIds.length > 0 ? diagnostic.visibleDialogTestIds.join(", ") : "none";

  return (
    `[session-purpose-overlay] Blocking overlay remained after cleanup. URL: ${diagnostic.pageUrl}. ` +
    `Overlay count: ${diagnostic.overlayCount}. Chooser visible: ${diagnostic.chooserVisible ? "yes" : "no"}. ` +
    `Live action enabled: ${diagnostic.liveActionEnabled ? "yes" : "no"}. ` +
    `Visible dialogs: ${dialogSummary}. Target: ${diagnostic.targetDescription}.`
  );
}
