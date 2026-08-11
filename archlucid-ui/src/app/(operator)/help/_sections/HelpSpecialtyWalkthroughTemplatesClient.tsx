"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
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
  SPECIALTY_REVIEW_CLOUD_CONTEXT_OPTIONS,
  SPECIALTY_REVIEW_TEMPLATES,
  SPECIALTY_REVIEW_TEMPLATES_GUIDE_HEADINGS,
  SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_BULLETS,
  SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_INTEGRATIONS_NOTE,
  SPECIALTY_REVIEW_TEMPLATES_INTRO,
  SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE,
  SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE,
  SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT,
  SPECIALTY_REVIEW_TEMPLATES_RELATED_LINKS,
  SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL,
  specialtyReviewTemplatesCompareHref,
  type SpecialtyReviewCloudContext,
  type SpecialtyReviewTemplateDefinition,
  type SpecialtyReviewTemplateId,
} from "@/lib/specialty-review-templates";

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
              <PreviewSection title="Example review questions" items={template.preview.exampleQuestions} />
              <PreviewSection title="Evidence typically requested" items={template.preview.evidenceTypicallyRequested} />
              <PreviewSection title="Policy areas involved" items={template.preview.policyAreas} />
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

function SpecialtyTemplateCard(props: {
  readonly template: SpecialtyReviewTemplateDefinition;
  readonly selected: boolean;
  readonly canExecute: boolean;
  readonly cloudContext: SpecialtyReviewCloudContext;
  readonly onSelect: (templateId: SpecialtyReviewTemplateId) => void;
  readonly onPreview: (template: SpecialtyReviewTemplateDefinition) => void;
  readonly onCloudChange: (cloud: SpecialtyReviewCloudContext) => void;
}): React.ReactElement {
  const { template, selected, canExecute, cloudContext } = props;
  const cloudFieldId = useId();

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-neutral-200 dark:border-neutral-800",
        selected && "ring-2 ring-teal-700/50 ring-offset-2 ring-offset-white dark:ring-teal-500/40 dark:ring-offset-neutral-950",
      )}
      data-testid={`specialty-template-card-${template.id}`}
      aria-current={selected ? "true" : undefined}
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{template.title}</CardTitle>
          {selected ? <StatusTag kind="ready" label="Selected" /> : null}
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{template.purpose}</p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "flex flex-1 flex-col gap-3")}>
        <div>
          <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>Best for</p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{template.bestFor}</p>
        </div>
        <div>
          <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>Focus areas</p>
          <div className="mt-2">
            <SpecialtyTemplateFocusTags areas={template.focusAreas} />
          </div>
        </div>
        {template.supportsCloudContext ? (
          <fieldset className="m-0 space-y-2 border-0 p-0">
            <legend className={cn("text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>
              Cloud context
            </legend>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_REVIEW_CLOUD_CONTEXT_OPTIONS.map((option) => {
                const inputId = `${cloudFieldId}-${option.id}`;

                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm",
                      cloudContext === option.id
                        ? "border-teal-700/40 bg-teal-50/80 dark:border-teal-600/40 dark:bg-teal-950/30"
                        : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
                    )}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`${cloudFieldId}-cloud`}
                      className="sr-only"
                      checked={cloudContext === option.id}
                      onChange={() => props.onCloudChange(option.id)}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        <div className="mt-auto">
          <p className={cn("m-0 text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>
            Expected outcome
          </p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{template.expectedOutput}</p>
        </div>
      </CardContent>
      <CardFooter className={cn(OPERATOR_CARD.content, "mt-auto flex flex-wrap gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800")}>
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
            title={SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT}
            data-testid={`specialty-template-use-${template.id}`}
          >
            Use template
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function SelectedTemplateBanner(props: {
  readonly template: SpecialtyReviewTemplateDefinition;
  readonly cloudContext: SpecialtyReviewCloudContext;
  readonly onChange: () => void;
  readonly onRemove: () => void;
  readonly onContinue: () => void;
  readonly isContinuing: boolean;
  readonly loadingLabel: string;
}): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-teal-200/80 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="specialty-template-selection-banner"
      role="status"
      aria-busy={props.isContinuing}
    >
      <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Selected template: {props.template.title}
      </p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        Continue to review setup to edit the prefilled brief. Starting the review still requires your confirmation on
        the review creation page.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ReviewStartLoadingButton
          size="sm"
          idleLabel="Continue to review setup"
          loadingLabel={props.loadingLabel}
          isLoading={props.isContinuing}
          onClick={props.onContinue}
          data-testid="specialty-template-continue-setup"
        />
        <Button type="button" size="sm" variant="outline" onClick={props.onChange} disabled={props.isContinuing}>
          Change template
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={props.onRemove} disabled={props.isContinuing}>
          Remove template
        </Button>
      </div>
    </div>
  );
}

/** Customer-facing specialty template catalog for `/help/specialty-walkthroughs`. */
export function HelpSpecialtyWalkthroughTemplatesClient(
  props: HelpSpecialtyWalkthroughTemplatesClientProps,
): React.ReactElement {
  void props;
  const canExecute = useOperateCapability();
  const navigation = useReviewIntakeNavigation();
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

  const handleChangeTemplate = useCallback(() => {
    document.getElementById("specialty-template-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <article data-testid="help-specialty-walkthrough-templates" aria-busy={navigation.isNavigating}>
      <HelpTopicHashScroll />
      <OperatorPageContainer variant="reading" className="w-full max-w-[1100px] space-y-6">
        <header className="space-y-3 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <HelpTopicTitleRow title={SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE} actions={<PageContextualHelpButton />} />
          <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>{SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE}</p>
          <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.body)}>{SPECIALTY_REVIEW_TEMPLATES_INTRO}</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE}</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/architecture/reviews/new">{SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL}</Link>
            </Button>
          </div>
          {!canExecute ? (
            <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)} data-testid="specialty-template-permission-hint">
              {SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT}
            </p>
          ) : null}
        </header>
{selectedTemplate !== null ? (
          <SelectedTemplateBanner
            template={selectedTemplate}
            cloudContext={selectedTemplate.supportsCloudContext ? saasCloudContext : "None"}
            onChange={handleChangeTemplate}
            onRemove={handleRemoveSelection}
            onContinue={handleContinueToReviewSetup}
            isContinuing={navigation.isNavigating}
            loadingLabel={navigation.loadingLabel}
          />
        ) : null}

        {navigation.showStagedPanel && navigation.activeStageId !== null ? (
          <ReviewStartStagedProgress
            stages={navigation.stages}
            activeStageId={navigation.activeStageId}
            headline={REVIEW_START_PREPARING_LABEL}
            testId="specialty-template-review-start-progress"
          />
        ) : null}

        {navigation.error !== null ? <ReviewStartInlineError message={navigation.error} /> : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_12.5rem] lg:items-start">
          <div className="min-w-0 space-y-8">
            <section
              id="specialty-template-catalog"
              aria-labelledby="specialty-template-catalog-heading"
              className="space-y-4"
            >
              <h2 id="specialty-template-catalog-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                Available templates
              </h2>
              <div
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                data-testid="specialty-template-card-grid"
              >
                {SPECIALTY_REVIEW_TEMPLATES.map((template) => (
                  <SpecialtyTemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplateId === template.id}
                    canExecute={canExecute}
                    cloudContext={template.id === "saas-readiness" ? saasCloudContext : "None"}
                    onSelect={handleSelect}
                    onPreview={(row) => setPreview({ template: row })}
                    onCloudChange={setSaasCloudContext}
                  />
                ))}
              </div>
            </section>

            <section id="integrations-optional" aria-labelledby="integrations-optional-heading">
              <h2 id="integrations-optional-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                Integrations
              </h2>
              <p className={cn("m-0 mt-2 max-w-prose", OPERATOR_TYPOGRAPHY.body)}>
                {SPECIALTY_REVIEW_TEMPLATES_INTEGRATIONS_NOTE}
              </p>
            </section>

            <section
              id="need-help-choosing"
              aria-labelledby="need-help-choosing-heading"
              className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/30"
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

            <section aria-labelledby="specialty-related-links-heading" className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 id="specialty-related-links-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Related
              </h2>
              <ul className={cn("m-0 mt-2 flex flex-wrap gap-x-4 gap-y-2 p-0 list-none", OPERATOR_TYPOGRAPHY.body)}>
                {SPECIALTY_REVIEW_TEMPLATES_RELATED_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <HelpTopicTableOfContents headings={[...SPECIALTY_REVIEW_TEMPLATES_GUIDE_HEADINGS]} />
        </div>
      </OperatorPageContainer>

      <SpecialtyTemplatePreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </article>
  );
}
