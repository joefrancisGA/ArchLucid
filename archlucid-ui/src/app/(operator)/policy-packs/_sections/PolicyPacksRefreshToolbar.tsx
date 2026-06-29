import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  policyPacksRefreshAssistReaderLine,
  policyPacksRefreshAssistReaderLineBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { cn } from "@/lib/utils";
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
      <Button type="button" variant="secondary" size="sm" onClick={() => void onRefresh()} disabled={loading}>
        {loading ? "Loading…" : "Refresh"}
      </Button>
      {!canMutatePacks ? (
        <span className={cn("max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolishedShell ? policyPacksRefreshAssistReaderLineBuyerPolished : policyPacksRefreshAssistReaderLine}
        </span>
      ) : null}
    </div>
  );
}
