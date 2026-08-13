/**
 * Buyer-polished shell: which {@link OperatorPageHeader} `helpKey` values may keep the
 * contextual info control without also providing {@link OperatorPageHeaderProps.buyerTitleHint}.
 * Keys here have sponsor-oriented copy in `contextual-help-content.ts`.
 */
export function isBuyerPolishedHeaderContextualHelpAllowed(helpKey: string): boolean {
  switch (helpKey) {
    case "architecture-graph":
    case "ask-archlucid":
    case "governance-workflow":
    case "audit-log":
      return true;

    default:
      return false;
  }
}
