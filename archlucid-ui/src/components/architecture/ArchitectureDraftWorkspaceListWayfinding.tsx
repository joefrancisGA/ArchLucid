import Link from "next/link";

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { ARCHITECTURE_DRAFT_WORKSPACE_BACK_TO_LIST_LABEL } from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Secondary exit from an edit draft workspace back to the browser-local draft list (TB-1453). */
export function ArchitectureDraftWorkspaceListWayfinding(): React.JSX.Element {
  return (
    <Link
      href={ARCHITECTURES_LIST_PATH}
      className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium text-teal-800 underline dark:text-teal-300")}
      data-testid="architecture-draft-workspace-back-to-list"
    >
      {ARCHITECTURE_DRAFT_WORKSPACE_BACK_TO_LIST_LABEL}
    </Link>
  );
}
