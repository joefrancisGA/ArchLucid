import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export function GraphSuspenseFallback() {
  return (
    <div className={isBuyerPolishedOperatorShellEnv() ? "max-w-6xl" : "max-w-4xl"}>
      <OperatorLoadingNotice>
        <strong>Loading graph.</strong>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">Reading review id from the URL…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
