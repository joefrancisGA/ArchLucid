import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function AskSuspenseFallback() {
  return (
    <div className="max-w-5xl p-4">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading Ask…</p>
    </div>
  );
}
