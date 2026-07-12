import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function HelpTopicNotFoundView(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10" data-testid="help-topic-not-found">
      <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Help topic not found</h1>
      <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        This help topic is unavailable or you do not have access to view it.
      </p>
      <p className={cn("mt-4", OPERATOR_TYPOGRAPHY.body)}>
        <Link href="/help" className="font-medium text-teal-800 underline dark:text-teal-300">
          Back to Help
        </Link>
      </p>
    </div>
  );
}
