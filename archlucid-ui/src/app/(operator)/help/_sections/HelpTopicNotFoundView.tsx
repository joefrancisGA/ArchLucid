import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function HelpTopicNotFoundView(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10" data-testid="help-topic-not-found">
      <HelpTopicTitleRow title="Help topic not found" />
      <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        This help topic is unavailable or you do not have access to view it.
      </p>
      <p className={cn("mt-4", OPERATOR_TYPOGRAPHY.body)}>
        <Link href="/help" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          Back to Help
        </Link>
      </p>
    </div>
  );
}
