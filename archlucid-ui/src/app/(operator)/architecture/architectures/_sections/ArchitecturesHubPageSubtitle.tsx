"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  architecturesHubPageSubtitle,
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
} from "@/lib/architectures-hub-copy";

/** `/architecture/architectures` subtitle — Guided eval chrome uses shorter intake-oriented copy. */
export function ArchitecturesHubPageSubtitle(): React.JSX.Element {
  const evalChromeShell = useProductionEvalChrome();

  return <>{architecturesHubPageSubtitle(evalChromeShell)}</>;
}

export { ARCHITECTURES_HUB_PAGE_SUBTITLE };
