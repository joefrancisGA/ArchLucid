"use client";

import { useRegisterHelpPageSituation } from "@/components/help/help-page-situation-store";
import type { HelpPageSituation } from "@/lib/help/help-page-situation";

export type HelpPageSituationRegistrarProps = {
  readonly situation: HelpPageSituation | null;
};

/** Publishes the current page's review situation to the Help drawer. Renders nothing. */
export function HelpPageSituationRegistrar({ situation }: HelpPageSituationRegistrarProps): null {
  useRegisterHelpPageSituation(situation);

  return null;
}
