"use client";

import Link from "next/link";

import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { SpecialtyTemplatePolicyPackProvenance } from "@/components/help/SpecialtyTemplatePolicyPackProvenance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL,
  type SpecialtyReviewTemplateDefinition,
  type SpecialtyReviewTemplateId,
} from "@/lib/specialty-review-templates";
import { cn } from "@/lib/utils";

export const SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID = "specialty-template-permission-hint";

function SpecialtyTemplateFocusAreasText(props: { readonly areas: readonly string[] }): React.ReactElement {
  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="specialty-template-focus-areas">
      {props.areas.join(", ")}
    </p>
  );
}

function SpecialtyTemplateCardSelectionFooter(props: {
  readonly canExecute: boolean;
  readonly isContinuing: boolean;
  readonly loadingLabel: string;
  readonly onContinue: () => void;
  readonly onRemove: () => void;
}): React.ReactElement {
  return (
    <div
      className={cn("w-full space-y-2", HELP_PAGE_LAYOUT.selectionFooterDivider)}
      role="status"
      aria-busy={props.isContinuing}
      data-testid="specialty-template-card-selection-footer"
    >
      <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>
        Selected — continue to review setup to edit the prefilled brief.
      </p>
      <div className="flex flex-wrap gap-2">
        {props.canExecute ? (
          <ReviewStartLoadingButton
            size="sm"
            idleLabel="Continue to review setup"
            loadingLabel={props.loadingLabel}
            isLoading={props.isContinuing}
            onClick={props.onContinue}
            data-testid="specialty-template-continue-setup"
          />
        ) : (
          <Button
            type="button"
            size="sm"
            disabled
            aria-describedby={SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
            data-testid="specialty-template-continue-setup"
          >
            Continue to review setup
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={props.onRemove} disabled={props.isContinuing}>
          Remove template
        </Button>
      </div>
    </div>
  );
}

export type SpecialtyTemplateCardProps = {
  readonly template: SpecialtyReviewTemplateDefinition;
  readonly selected: boolean;
  readonly canExecute: boolean;
  readonly permissionLoading?: boolean;
  readonly onSelect: (templateId: SpecialtyReviewTemplateId) => void;
  readonly onPreview: (template: SpecialtyReviewTemplateDefinition) => void;
  readonly onRemoveSelection: () => void;
  readonly onContinue: () => void;
  readonly isContinuing: boolean;
  readonly loadingLabel: string;
};

export function SpecialtyTemplateCard(props: SpecialtyTemplateCardProps): React.ReactElement {
  const { template, selected, canExecute, permissionLoading = false } = props;
  const useTemplateLabel = permissionLoading ? "Checking permission…" : "Use template";

  return (
    <Card
      className={cn(
        "grid grid-rows-subgrid gap-0 border-neutral-200 dark:border-neutral-800",
        "row-span-6",
        selected && HELP_PAGE_LAYOUT.selectedCardRing,
      )}
      data-testid={`specialty-template-card-${template.id}`}
      aria-current={selected ? "true" : undefined}
    >
      <CardHeader className={cn(OPERATOR_CARD.header, "row-start-1")}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle as="h3" className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{template.title}</CardTitle>
          {selected ? <StatusTag kind="ready" label="Selected" /> : null}
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{template.purpose}</p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "row-start-2 grid grid-rows-subgrid gap-3 row-span-4")}>
        <div className="row-start-1">
          <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>Best for</p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{template.bestFor}</p>
        </div>
        <div className="row-start-2">
          <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>Focus areas</p>
          <div className="mt-1">
            <SpecialtyTemplateFocusAreasText areas={template.focusAreas} />
          </div>
        </div>
        <div className="row-start-3">
          <SpecialtyTemplatePolicyPackProvenance
            policyPacks={template.policyPacks}
            lastReviewedUtc={template.lastReviewedUtc}
            isLoading={permissionLoading}
            testId={`specialty-template-policy-packs-${template.id}`}
          />
        </div>
        <div className="row-start-4">
          <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>
            Expected outcome
          </p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{template.expectedOutput}</p>
        </div>
      </CardContent>
      <CardFooter
        className={cn(
          OPERATOR_CARD.content,
          "row-start-6 flex flex-col flex-wrap gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800",
        )}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onPreview(template)}
            data-testid={`specialty-template-preview-${template.id}`}
          >
            Preview
          </Button>
          {canExecute && !permissionLoading ? (
            <Button
              type="button"
              size="sm"
              onClick={() => props.onSelect(template.id)}
              data-testid={`specialty-template-use-${template.id}`}
            >
              {useTemplateLabel}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled
              aria-busy={permissionLoading}
              aria-describedby={permissionLoading ? undefined : SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
              data-testid={`specialty-template-use-${template.id}`}
            >
              {useTemplateLabel}
            </Button>
          )}
          <Button asChild size="sm" variant="outline" data-testid={`specialty-template-sample-review-${template.id}`}>
            <Link href={template.sampleReviewHref}>{SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL}</Link>
          </Button>
        </div>
        {selected ? (
          <SpecialtyTemplateCardSelectionFooter
            canExecute={canExecute && !permissionLoading}
            isContinuing={props.isContinuing}
            loadingLabel={props.loadingLabel}
            onContinue={props.onContinue}
            onRemove={props.onRemoveSelection}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}
