import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function PolicyPacksBuyerPolishedAdministratorNote() {
  return (
    <p className={cn("mb-8 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
      Version comparison, raw configuration inspection, and lifecycle assignments remain administrator workflows in production
      workspaces.
    </p>
  );
}
