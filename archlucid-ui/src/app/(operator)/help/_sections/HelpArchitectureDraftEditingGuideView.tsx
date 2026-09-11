import type { ReactElement } from "react";
import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_OVERVIEW,
  ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_TITLE,
  ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION,
  ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_DRAFT_EDITING_HELP_GUIDE_TEST_ID,
  ARCHITECTURE_DRAFT_EDITING_HELP_RELATED,
  ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_TITLE,
} from "@/lib/architecture/architecture-draft-editing-help-guide-content";
import { ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_PATH } from "@/lib/architecture/architecture-draft-editing-help-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpArchitectureDraftEditingGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function HelpSection(props: {
  readonly id: string;
  readonly title: string;
  readonly copy: string;
  readonly testId: string;
}): React.ReactElement {
  return (
    <section
      aria-labelledby={props.id}
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid={props.testId}
    >
      <h2 id={props.id} className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.title}</h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.copy}</p>
    </section>
  );
}

/** LW-094 — two architects on one draft for `/help/architecture-draft-editing`. */
export function HelpArchitectureDraftEditingGuideView(
  props: HelpArchitectureDraftEditingGuideViewProps,
): ReactElement {
  const { entry } = props;

  return (
    <div className={operatorPageContainerClass()} data-testid={ARCHITECTURE_DRAFT_EDITING_HELP_GUIDE_TEST_ID}>
      <HelpTopicHashScroll />
      <HelpTopicGuidePageHeader
        eyebrow="Architecture desk"
        title={ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_TITLE}
        titleTestId="help-architecture-draft-editing-page-title"
        subtitle={ARCHITECTURE_DRAFT_EDITING_HELP_PAGE_SUBTITLE}
        navHref={ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_PATH}
      />
      <div
        className={cn(OPERATOR_LAYOUT.majorSectionGap, "pb-10")}
        data-testid={ARCHITECTURE_DRAFT_EDITING_HELP_FIRST_VIEWPORT_TEST_ID}
        id={ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_CONTENT_ID}
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-architecture-draft-editing-overview">
          {ARCHITECTURE_DRAFT_EDITING_HELP_OVERVIEW}
        </p>

        <div className="space-y-4">
          <HelpSection
            id="edit-lease"
            title={ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_TITLE}
            copy={ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_COPY}
            testId="help-architecture-draft-editing-lease"
          />
          <HelpSection
            id="take-over-lease"
            title={ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_TITLE}
            copy={ARCHITECTURE_DRAFT_EDITING_HELP_STEAL_COPY}
            testId="help-architecture-draft-editing-steal"
          />
          <HelpSection
            id="conflict-keep-mine"
            title={ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_TITLE}
            copy={ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_COPY}
            testId="help-architecture-draft-editing-conflict"
          />
          <HelpSection
            id="offline-reconnect"
            title={ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_TITLE}
            copy={ARCHITECTURE_DRAFT_EDITING_HELP_OFFLINE_COPY}
            testId="help-architecture-draft-editing-offline"
          />
          <HelpSection
            id="not-collab"
            title={ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_TITLE}
            copy={ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_COPY}
            testId="help-architecture-draft-editing-boundary"
          />
        </div>

        <section aria-labelledby="where-to-go-next" className="space-y-3" data-testid="help-architecture-draft-editing-next">
          <h2 id="where-to-go-next" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Where to go next</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" size="sm" asChild>
              <Link href={ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION.href}>
                {ARCHITECTURE_DRAFT_EDITING_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={ARCHITECTURE_DRAFT_EDITING_HELP_RELATED.href}>{ARCHITECTURE_DRAFT_EDITING_HELP_RELATED.label}</Link>
            </Button>
          </div>
        </section>

        <HelpTopicRegistryProvenanceLine entry={entry} />
      </div>
    </div>
  );
}
