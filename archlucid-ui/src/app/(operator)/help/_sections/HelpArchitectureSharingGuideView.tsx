import type { ReactElement } from "react";

import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHITECTURE_SHARING_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SHARING_HELP_CLAIM_HEADING_ID,
} from "@/lib/architecture-sharing-help-evidence-copy";
import {
  ARCHITECTURE_SHARING_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_SHARING_HELP_GRANDFATHER_COPY,
  ARCHITECTURE_SHARING_HELP_NOT_IN_PRODUCT_COPY,
  ARCHITECTURE_SHARING_HELP_OVERVIEW,
  ARCHITECTURE_SHARING_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_SHARING_HELP_PAGE_TITLE,
  ARCHITECTURE_SHARING_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_SHARING_HELP_ROLE_CARDS,
} from "@/lib/architecture-sharing-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpArchitectureSharingGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** AS-098 — restrict-to-shares boundary for `/help/architecture-sharing`. */
export function HelpArchitectureSharingGuideView(props: HelpArchitectureSharingGuideViewProps): ReactElement {
  const { entry } = props;

  return (
    <div className={operatorPageContainerClass()} data-testid="help-architecture-sharing-guide">
      <HelpTopicHashScroll />
      <HelpTopicGuidePageHeader
        eyebrow="Architecture desk"
        title={ARCHITECTURE_SHARING_HELP_PAGE_TITLE}
        subtitle={ARCHITECTURE_SHARING_HELP_PAGE_SUBTITLE}
      />
      <div
        className={cn(OPERATOR_LAYOUT.majorSectionGap, "pb-10")}
        data-testid={ARCHITECTURE_SHARING_HELP_FIRST_VIEWPORT_TEST_ID}
        id={ARCHITECTURE_SHARING_HELP_PRIMARY_CONTENT_ID}
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ARCHITECTURE_SHARING_HELP_OVERVIEW}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {ARCHITECTURE_SHARING_HELP_ROLE_CARDS.map((role) => (
            <section
              key={role.roleId}
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid={`help-architecture-sharing-role-${role.roleId}`}
            >
              <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{role.title}</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{role.body}</p>
            </section>
          ))}
        </div>
        <section
          className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="help-architecture-sharing-grandfather"
        >
          <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Grandfather default stays open</h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ARCHITECTURE_SHARING_HELP_GRANDFATHER_COPY}</p>
        </section>
        <section
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
          data-testid="help-architecture-sharing-not-in-product"
          id={ARCHITECTURE_SHARING_HELP_CLAIM_HEADING_ID}
        >
          <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Not a second tenant or chat</h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ARCHITECTURE_SHARING_HELP_NOT_IN_PRODUCT_COPY}</p>
          <p className={cn("mt-3 mb-0", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_SHARING_HELP_CLAIM_DISCIPLINE}</p>
        </section>
        <HelpTopicRegistryProvenanceLine entry={entry} />
      </div>
    </div>
  );
}
