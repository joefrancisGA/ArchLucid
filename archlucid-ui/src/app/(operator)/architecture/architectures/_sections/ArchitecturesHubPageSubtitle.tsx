"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  architecturesHubPageSubtitle,
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
} from "@/lib/architectures-hub-copy";

/** `/architecture/architectures` subtitle — buyer shell uses shorter intake-oriented copy. */
export function ArchitecturesHubPageSubtitle(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return <>{architecturesHubPageSubtitle(buyerPolishedShell)}</>;
}

export { ARCHITECTURES_HUB_PAGE_SUBTITLE };
