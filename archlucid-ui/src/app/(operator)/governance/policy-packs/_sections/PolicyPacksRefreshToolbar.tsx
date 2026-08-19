import { cn } from "@/lib/utils";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  policyPacksRefreshAssistReaderLine,
  policyPacksRefreshAssistReaderLineBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PolicyPacksRefreshToolbarProps = {
  buyerPolishedShell: boolean;
  canMutatePacks: boolean;
  loading: boolean;
  onRefresh: () => void;
};

export function PolicyPacksRefreshToolbar(props: PolicyPacksRefreshToolbarProps) {
  const { buyerPolishedShell, canMutatePacks, loading, onRefresh } = props;

  return (
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <RefreshButton busy={loading} onClick={() => void onRefresh()} />
      {!canMutatePacks ? (
        <span className={cn("max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolishedShell ? policyPacksRefreshAssistReaderLineBuyerPolished : policyPacksRefreshAssistReaderLine}
        </span>
      ) : null}
    </div>
  );
}
