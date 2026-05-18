import type { ReactNode } from "react";

import { BuyerTitleHint } from "@/components/BuyerTitleHint";
import { ContextualHelp } from "@/components/ContextualHelp";
import { HelpButton } from "@/components/ui/help-button";
import { isBuyerPolishedHeaderContextualHelpAllowed } from "@/lib/buyer-polished-header-help";
import {
  isBuyerPolishedOperatorShellEnv,
  isBuyerSafeDemoMarketingChromeEnv,
} from "@/lib/demo-ui-env";

export type OperatorPageHeaderProps = {
  title: string;
  subtitle?: string;
  helpKey?: string;
  /** Buyer shell: one-line tooltip beside the title (graph, heavy explanation surfaces). */
  buyerTitleHint?: string;
  /**
   * Buyer-polished shell: show the docs link (?) in the title row. Default omit — sponsor demos stay minimal;
   * operator-heavy pages can opt in.
   */
  buyerAllowHeaderDocsLink?: boolean;
  /** Page key for contextual docs link (see `getHelpUrl` in `contextual-help.ts`). */
  docsPageKey?: string;
  metadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function OperatorPageHeader({
  title,
  subtitle,
  helpKey,
  buyerTitleHint,
  buyerAllowHeaderDocsLink,
  docsPageKey,
  metadata,
  actions,
  children,
}: OperatorPageHeaderProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const hasBuyerTitleHint = buyerTitleHint !== undefined && buyerTitleHint.trim().length > 0;
  const omitDenseTitleHelpChrome =
    buyerPolishedShell && isBuyerSafeDemoMarketingChromeEnv();

  const showContextualHelp =
    helpKey != null &&
    !omitDenseTitleHelpChrome &&
    (!buyerPolishedShell ||
      hasBuyerTitleHint ||
      isBuyerPolishedHeaderContextualHelpAllowed(helpKey));

  const showDocsHelp =
    docsPageKey != null &&
    !omitDenseTitleHelpChrome &&
    (!buyerPolishedShell || buyerAllowHeaderDocsLink === true);

  return (
    <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-xl font-bold text-neutral-900 dark:text-neutral-50">{title}</h2>
        {buyerTitleHint !== undefined && buyerTitleHint.trim().length > 0 ? (
          <BuyerTitleHint text={buyerTitleHint.trim()} />
        ) : null}
        {showContextualHelp ? <ContextualHelp helpKey={helpKey!} /> : null}
        {showDocsHelp ? <HelpButton pageKey={docsPageKey!} /> : null}
        {actions != null && (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {subtitle != null && (
        <p className="m-0 mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      )}

      {metadata != null && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
          {metadata}
        </div>
      )}

      {children != null && <div className="mt-4">{children}</div>}
    </header>
  );
}
