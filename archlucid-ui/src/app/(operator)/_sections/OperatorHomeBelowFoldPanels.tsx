"use client";

import { OperatorHomeAdvancedGuidancePanel } from "@/components/operator-home/OperatorHomeAdvancedGuidancePanel";
import { OperatorHomeExamplesPlacement } from "@/components/operator-home/OperatorHomeExamplesPlacement";
import { OperatorHomeWorkspaceContextDisclosure } from "@/components/operator-home/OperatorHomeWorkspaceContextDisclosure";
import { OperatorHomeFirstValueCallout } from "@/components/operator-home/OperatorHomeDeferredOnboarding";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";

import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";

type OperatorHomeBelowFoldPanelsProps = {
  readonly model: OperatorHomePageViewModel;
  readonly buyerPolishedShell: boolean;
  readonly showFirstValueCallout?: boolean;
};

/** Below-fold home panels — deferred off `/` First Load JS (TB-2145). */
export function OperatorHomeBelowFoldPanels(props: OperatorHomeBelowFoldPanelsProps) {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  return (
    <>
      {props.showFirstValueCallout === true ? <OperatorHomeFirstValueCallout /> : null}

      <OperatorHomeExamplesPlacement
        beforeWorkspaceContext={null}
        afterWorkspaceContext={
          <>
            <OperatorHomeWorkspaceContextDisclosure
              showWorkspaceStatus={props.buyerPolishedShell ? false : fullOperatorShell}
              runsDashboard={props.model.runsDashboard}
            />
            <OperatorHomeAdvancedGuidancePanel
              buyerPolishedShell={props.buyerPolishedShell}
              fullOperatorShell={props.buyerPolishedShell ? undefined : fullOperatorShell}
              checklistVariant={
                props.buyerPolishedShell ? "compact" : fullOperatorShell ? "full" : "compact"
              }
            />
          </>
        }
      />
    </>
  );
}
