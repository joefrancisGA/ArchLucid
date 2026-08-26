import type { ReactElement } from "react";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { assertHelpTopicCatchAllFallthroughAllowed } from "@/lib/help/help-topic-catch-all-fallthrough";
import type { LoadedHelpTopicContent } from "@/lib/help/help-topic-content-loader";

import { tryResolveAdminHelpTopicView } from "./help-topic-view-resolver-admin";
import { tryResolveIntegrationsHelpTopicView } from "./help-topic-view-resolver-integrations";
import { tryResolveOperateHelpTopicView } from "./help-topic-view-resolver-operate";

// Dispatch anchors for TB-1601 source guard: choose-your-next-step → HelpPathChooserGuideView (operate module).

export function resolveHelpTopicView(
  loaded: LoadedHelpTopicContent,
  searchParams?: Record<string, string | string[] | undefined>,
): ReactElement {
  const operateView = tryResolveOperateHelpTopicView(loaded);

  if (operateView !== null) {
    return operateView;
  }

  const integrationsView = tryResolveIntegrationsHelpTopicView(loaded, searchParams);

  if (integrationsView !== null) {
    return integrationsView;
  }

  const adminView = tryResolveAdminHelpTopicView(loaded);

  if (adminView !== null) {
    return adminView;
  }

  assertHelpTopicCatchAllFallthroughAllowed(loaded.entry);

  return (
    <HelpTopicMarkdownView
      entry={loaded.entry}
      markdown={loaded.markdown}
      showContextualHelp
    />
  );
}
