"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { SpecialtyTemplateCloudContextPicker } from "@/components/help/SpecialtyTemplateCloudContextPicker";
import { SpecialtyTemplateComparisonTable } from "@/components/help/SpecialtyTemplateComparisonTable";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useReviewIntakeNavigation } from "@/hooks/use-review-intake-navigation";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
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
  type SpecialtyReviewTemplateId,
} from "@/lib/specialty-review-templates";

import { SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID, SpecialtyTemplateCard } from "./SpecialtyTemplateCard";
import {
  SpecialtyTemplatePreviewDialog,
  type SpecialtyTemplatePreviewState,
} from "./SpecialtyTemplatePreviewDialog";

type HelpSpecialtyWalkthroughTemplatesClientProps = {
  readonly entry: ProductDocumentationEntry;
};

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
      <OperatorPageContainer variant="workflow" className="space-y-4">
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
