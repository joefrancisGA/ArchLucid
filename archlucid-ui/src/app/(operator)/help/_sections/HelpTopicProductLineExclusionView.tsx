import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpTopicProductLineExclusionContent } from "@/lib/help/help-topic-product-line-exclusion-copy";
import { cn } from "@/lib/utils";

type HelpTopicProductLineExclusionViewProps = {
  readonly content: HelpTopicProductLineExclusionContent;
  readonly testId?: string;
};

/** Product-line redirect when a help topic is excluded from the active shell (SecureNow). */
export function HelpTopicProductLineExclusionView(
  props: HelpTopicProductLineExclusionViewProps,
): React.ReactElement {
  const { content, testId = "help-topic-product-line-exclusion" } = props;

  return (
    <OperatorPageContainer variant="reading" className="px-4 py-10" data-testid={testId}>
      <HelpTopicTitleRow title={content.title} />
      <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {content.body}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {content.redirects.map((redirect, index) => (
          <div key={redirect.href} className="max-w-2xl">
            {index === 0 ? (
              <Button asChild size="sm" variant="primary">
                <Link href={redirect.href} data-testid={`${testId}-redirect-primary`}>
                  {redirect.label}
                </Link>
              </Button>
            ) : (
              <Link
                href={redirect.href}
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                data-testid={`${testId}-redirect-${index}`}
              >
                {redirect.label}
              </Link>
            )}
            {redirect.description !== undefined ? (
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {redirect.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </OperatorPageContainer>
  );
}
