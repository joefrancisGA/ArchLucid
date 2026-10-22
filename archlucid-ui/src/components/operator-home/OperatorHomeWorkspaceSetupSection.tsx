import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OperatorHomeAdvancedGuidancePanel } from "@/components/operator-home/OperatorHomeAdvancedGuidancePanel";
import { OperatorHomeContinueSetupSlot } from "@/components/operator-home/OperatorHomeContinueSetupSlot";
import { OperatorHomeWorkspaceContextDisclosure } from "@/components/operator-home/OperatorHomeWorkspaceContextDisclosure";
import { OPERATOR_HOME_WORKSPACE_SETUP_SECTION_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_PRIMARY_SECTION_HEADING, OPERATOR_LAYOUT } from "@/lib/design-tokens";

type OperatorHomeWorkspaceSetupSectionProps = {
  readonly buyerPolishedShell: boolean;
  readonly fullOperatorShell?: boolean;
  readonly checklistVariant?: "full" | "compact";
  readonly showWorkspaceStatus?: boolean;
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
};

/** Section B — workspace setup: metrics, walkthroughs, and optional admin diagnostics. */
export function OperatorHomeWorkspaceSetupSection(
  props: OperatorHomeWorkspaceSetupSectionProps,
): React.JSX.Element {
  return (
    <section aria-labelledby="operator-home-workspace-setup-section-heading" className={OPERATOR_LAYOUT.majorSectionGap}>
      <h2 id="operator-home-workspace-setup-section-heading" className={OPERATOR_HOME_PRIMARY_SECTION_HEADING}>
        {OPERATOR_HOME_WORKSPACE_SETUP_SECTION_TITLE}
      </h2>

      <div className={OPERATOR_LAYOUT.sectionStack}>
        <OperatorHomeWorkspaceContextDisclosure
          showWorkspaceStatus={props.showWorkspaceStatus === true}
          runsDashboard={props.runsDashboard}
        />
        <OperatorHomeAdvancedGuidancePanel
          buyerPolishedShell={props.buyerPolishedShell}
          fullOperatorShell={props.fullOperatorShell}
          checklistVariant={props.checklistVariant}
        />
        <OperatorHomeContinueSetupSlot placement="prominent" />
      </div>
    </section>
  );
}
