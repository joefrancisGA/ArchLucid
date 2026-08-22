"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { SpecialtyTemplateCloudContextPicker } from "@/components/help/SpecialtyTemplateCloudContextPicker";
import { SpecialtyTemplateComparisonTable } from "@/components/help/SpecialtyTemplateComparisonTable";
import { SpecialtyTemplatePolicyPackProvenance } from "@/components/help/SpecialtyTemplatePolicyPackProvenance";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useReviewIntakeNavigation } from "@/hooks/use-review-intake-navigation";
import {
  DESIGN_TOKENS,
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_CARD,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import {
  buildSpecialtyReviewUseTemplateHref,
  findSpecialtyReviewTemplate,
  SPECIALTY_REVIEW_TEMPLATES,
  SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_BULLETS,
  SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_INTEGRATIONS_NOTE,
  SPECIALTY_REVIEW_TEMPLATES_INTRO,
  SPECIALTY_REVIEW_TEMPLATES_INTRO_DISCLOSURE_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE,
  SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE,
  SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT,
  SPECIALTY_REVIEW_TEMPLATES_RELATED_LINKS,
  SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL,
  specialtyReviewTemplatesCompareHref,
  type SpecialtyReviewCloudContext,
  type SpecialtyReviewPolicyPackReference,
  type SpecialtyReviewTemplateDefinition,
  type SpecialtyReviewTemplateId,
} from "@/lib/specialty-review-templates";

const SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID = "specialty-template-permission-hint";

type HelpSpecialtyWalkthroughTemplatesClientProps = {
  readonly entry: ProductDocumentationEntry;
};

type SpecialtyTemplatePreviewState = {
  readonly template: SpecialtyReviewTemplateDefinition;
};

function SpecialtyTemplateFocusTags(props: { readonly areas: readonly string[] }): React.ReactElement {
  return (
    <ul className="m-0 flex flex-wrap gap-1.5 p-0 list-none" aria-label="Focus areas">
      {props.areas.map((area) => (
        <li key={area}>
          <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200">
            {area}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PreviewPolicyPackLinks(props: { readonly packs: readonly SpecialtyReviewPolicyPackReference[] }): React.ReactElement {
  return (
    <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
      {props.packs.map((pack) => (
        <li key={pack.id}>
          <Link href={pack.href} className={cn(OPERATOR_LINK.inline)}>
            {pack.label} v{pack.version}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SpecialtyTemplatePreviewDialog(props: {
  readonly preview: SpecialtyTemplatePreviewState | null;
  readonly onClose: () => void;
}): React.ReactElement {
  const template = props.preview?.template ?? null;

  return (
    <Dialog open={template !== null} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-h-[min(90dvh,42rem)] overflow-y-auto sm:max-w-lg" data-testid="specialty-template-preview-dialog">
        {template !== null ? (
          <>
            <DialogHeader>
              <DialogTitle>{template.title} preview</DialogTitle>
              <DialogDescription>{template.purpose}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <PreviewSection title="Sample review questions" items={template.preview.exampleQuestions} />
              <PreviewSection title="Evidence typically requested" items={template.preview.evidenceTypicallyRequested} />
              <section aria-label="Policy areas involved">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Policy areas involved</h3>
                <PreviewPolicyPackLinks packs={template.preview.policyAreas} />
              </section>
              <PreviewSection title="Likely outputs" items={template.preview.likelyOutputs} />
              <PreviewSection title="Optional integrations" items={template.preview.optionalIntegrations} />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                <Link href={template.sampleReviewHref} className={cn(OPERATOR_LINK.inline)}>
                  Open sample review
                </Link>
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PreviewSection(props: { readonly title: string; readonly items: readonly string[] }): React.ReactElement {
  return (
    <section aria-label={props.title}>
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</h3>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
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
      className="w-full space-y-2 border-t border-teal-200/80 pt-3 dark:border-teal-900/50"
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

function SpecialtyTemplateCard(props: {
  readonly template: SpecialtyReviewTemplateDefinition;
  readonly selected: boolean;
  readonly canExecute: boolean;
  readonly onSelect: (templateId: SpecialtyReviewTemplateId) => void;
  readonly onPreview: (template: SpecialtyReviewTemplateDefinition) => void;
  readonly onRemoveSelection: () => void;
  readonly onContinue: () => void;
  readonly isContinuing: boolean;
  readonly loadingLabel: string;
}): React.ReactElement {
  const { template, selected, canExecute } = props;

  return (
    <Card
      className={cn(
        "grid grid-rows-subgrid gap-0 border-neutral-200 dark:border-neutral-800",
        "row-span-6",
        selected && "ring-2 ring-teal-700/50 ring-offset-2 ring-offset-white dark:ring-teal-500/40 dark:ring-offset-neutral-950",
      )}
      data-testid={`specialty-template-card-${template.id}`}
      aria-current={selected ? "true" : undefined}
    >
      <CardHeader className={cn(OPERATOR_CARD.header, "row-start-1")}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{template.title}</CardTitle>
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
          <div className="mt-2">
            <SpecialtyTemplateFocusTags areas={template.focusAreas} />
          </div>
        </div>
        <div className="row-start-3">
          <SpecialtyTemplatePolicyPackProvenance
            policyPacks={template.policyPacks}
            lastReviewedUtc={template.lastReviewedUtc}
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
          {canExecute ? (
            <Button
              type="button"
              size="sm"
              onClick={() => props.onSelect(template.id)}
              data-testid={`specialty-template-use-${template.id}`}
            >
              Use template
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled
              aria-describedby={SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
              data-testid={`specialty-template-use-${template.id}`}
            >
              Use template
            </Button>
          )}
        </div>
        {selected ? (
          <SpecialtyTemplateCardSelectionFooter
            canExecute={canExecute}
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

/** Customer-facing specialty template catalog for `/help/specialty-walkthroughs`. */
export function HelpSpecialtyWalkthroughTemplatesClient(
  props: HelpSpecialtyWalkthroughTemplatesClientProps,
): React.ReactElement {
  void props;
  const canExecute = useOperateCapability();
  const navigation = useReviewIntakeNavigation();
  const cloudContextFieldsetId = useId();
  const [selectedTemplateId, setSelectedTemplateId] = useState<SpecialtyReviewTemplateId | null>(null);
  const [preview, setPreview] = useState<SpecialtyTemplatePreviewState | null>(null);
  const [saasCloudContext, setSaasCloudContext] = useState<SpecialtyReviewCloudContext>("None");

  const selectedTemplate = useMemo(
    () => (selectedTemplateId === null ? null : findSpecialtyReviewTemplate(selectedTemplateId) ?? null),
    [selectedTemplateId],
  );

  const handleSelect = useCallback((templateId: SpecialtyReviewTemplateId) => {
    setSelectedTemplateId(templateId);
  }, []);

  const handleRemoveSelection = useCallback(() => {
    setSelectedTemplateId(null);
  }, []);

  const handleContinueToReviewSetup = useCallback(() => {
    if (selectedTemplate === null) {
      return;
    }

    const href = buildSpecialtyReviewUseTemplateHref({
      intakeTemplateId: selectedTemplate.intakeTemplateId,
      cloudContext: selectedTemplate.supportsCloudContext ? saasCloudContext : undefined,
    });

    navigation.navigate({ href, hasTemplate: true });
  }, [navigation, saasCloudContext, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplateId === null) {
      return;
    }

    const continueButton = document.querySelector<HTMLButtonElement>(
      `[data-testid="specialty-template-card-${selectedTemplateId}"] [data-testid="specialty-template-continue-setup"]`,
    );

    continueButton?.focus();
  }, [selectedTemplateId]);

  const showCloudContextPicker = selectedTemplate?.supportsCloudContext === true;

  return (
    <article data-testid="help-specialty-walkthrough-templates" aria-busy={navigation.isNavigating}>
      <HelpTopicHashScroll />
      <OperatorPageContainer variant="reading" className="w-full max-w-[1100px] space-y-4">
        <header className="space-y-4 border-b border-neutral-200 p-4 pb-4 dark:border-neutral-800">
          <HelpTopicTitleRow title={SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE} actions={<PageContextualHelpButton />} />
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE}</p>
          <details className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/30">
            <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.helper)}>
              {SPECIALTY_REVIEW_TEMPLATES_INTRO_DISCLOSURE_TITLE}
            </summary>
            <p className={cn("m-0 mt-2 max-w-prose", OPERATOR_TYPOGRAPHY.body)}>{SPECIALTY_REVIEW_TEMPLATES_INTRO}</p>
            <p className={cn("m-0 mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE}</p>
          </details>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link href="/architecture/reviews/new" className={cn(OPERATOR_LINK.inline)}>
              {SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL}
            </Link>
          </p>
          {!canExecute ? (
            <p
              id={SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
              className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}
              data-testid={SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
            >
              {SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT}
            </p>
          ) : null}
        </header>

        {navigation.showStagedPanel && navigation.activeStageId !== null ? (
          <ReviewStartStagedProgress
            stages={navigation.stages}
            activeStageId={navigation.activeStageId}
            headline={REVIEW_START_PREPARING_LABEL}
            testId="specialty-template-review-start-progress"
          />
        ) : null}

        {navigation.stalled && navigation.stalledHref !== null ? (
          <ReviewStartNavigationStallNotice
            href={navigation.stalledHref}
            testId="specialty-template-review-start-stall"
          />
        ) : null}

        {navigation.error !== null ? <ReviewStartInlineError message={navigation.error} /> : null}

        <div className="min-w-0 space-y-4">
          <section
            id="specialty-template-catalog"
            aria-labelledby="specialty-template-catalog-heading"
            className="space-y-4"
          >
            <h2 id="specialty-template-catalog-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Available templates
            </h2>
            <div
              className="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-[repeat(6,auto)]"
              data-testid="specialty-template-card-grid"
            >
              {SPECIALTY_REVIEW_TEMPLATES.map((template) => (
                <SpecialtyTemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplateId === template.id}
                  canExecute={canExecute}
                  onSelect={handleSelect}
                  onPreview={(row) => setPreview({ template: row })}
                  onRemoveSelection={handleRemoveSelection}
                  onContinue={handleContinueToReviewSetup}
                  isContinuing={navigation.isNavigating}
                  loadingLabel={navigation.loadingLabel}
                />
              ))}
            </div>
            {showCloudContextPicker ? (
              <SpecialtyTemplateCloudContextPicker
                fieldsetId={cloudContextFieldsetId}
                cloudContext={saasCloudContext}
                onCloudChange={setSaasCloudContext}
              />
            ) : null}
          </section>

          <section
            id="specialty-template-comparison"
            aria-labelledby="specialty-template-comparison-heading"
            className="space-y-4"
          >
            <h2 id="specialty-template-comparison-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Compare templates
            </h2>
            <SpecialtyTemplateComparisonTable templates={SPECIALTY_REVIEW_TEMPLATES} />
          </section>

          <section id="integrations-optional" aria-labelledby="integrations-optional-heading" className="space-y-2">
            <h2 id="integrations-optional-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Integrations
            </h2>
            <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.body)}>
              {SPECIALTY_REVIEW_TEMPLATES_INTEGRATIONS_NOTE}
            </p>
          </section>

          <section
            id="need-help-choosing"
            aria-labelledby="need-help-choosing-heading"
            className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
            data-testid="specialty-template-help-choosing"
          >
            <h2 id="need-help-choosing-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_TITLE}
            </h2>
            <ul className={cn("m-0 mt-3 list-disc space-y-1.5 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_BULLETS.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={specialtyReviewTemplatesCompareHref()}>Compare templates</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/architecture/first-review-guide">Open first review guide</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>Contact support</Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="specialty-related-links-heading" className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <h2 id="specialty-related-links-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Related
            </h2>
            <ul className={cn("m-0 mt-2 flex flex-wrap gap-x-4 gap-y-2 p-0 list-none", OPERATOR_TYPOGRAPHY.body)}>
              {SPECIALTY_REVIEW_TEMPLATES_RELATED_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </OperatorPageContainer>

      <SpecialtyTemplatePreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </article>
  );
}
