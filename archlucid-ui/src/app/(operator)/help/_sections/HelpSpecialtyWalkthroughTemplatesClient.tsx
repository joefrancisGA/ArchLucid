"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { HelpSpecialtyWalkthroughClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughClaimOrientationStrip";
import { HelpSpecialtyWalkthroughEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughEvidenceOrientationStrip";
import { HelpSpecialtyWalkthroughHeaderActions } from "@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { SpecialtyTemplateCloudContextPicker } from "@/components/help/SpecialtyTemplateCloudContextPicker";
import { SpecialtyTemplateComparisonTable } from "@/components/help/SpecialtyTemplateComparisonTable";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useReviewIntakeNavigation } from "@/hooks/use-review-intake-navigation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import {
  SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH,
  SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE,
} from "@/lib/specialty-walkthroughs-help-evidence-copy";
import {
  SPECIALTY_WALKTHROUGHS_HELP_OVERVIEW,
  SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE,
  SPECIALTY_WALKTHROUGHS_HELP_PAGE_TITLE,
  SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION,
  SPECIALTY_WALKTHROUGHS_HELP_START_HERE_CARD_TITLE,
  specialtyWalkthroughsHelpPageSubtitle,
} from "@/lib/specialty-walkthroughs-help-guide-content";
import {
  SPECIALTY_WALKTHROUGHS_HELP_FIRST_VIEWPORT_TEST_ID,
  SPECIALTY_WALKTHROUGHS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_CONTENT_ID,
  SPECIALTY_WALKTHROUGHS_HELP_SKIP_LINK_LABEL,
  SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID,
} from "@/lib/specialty-walkthroughs-help-page-copy";
import {
  buildSpecialtyReviewUseTemplateHref,
  findSpecialtyReviewTemplate,
  SPECIALTY_REVIEW_TEMPLATES,
  SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_BULLETS,
  SPECIALTY_REVIEW_TEMPLATES_HELP_CHOOSING_TITLE,
  SPECIALTY_REVIEW_TEMPLATES_INTEGRATIONS_NOTE,
  SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE,
  SPECIALTY_REVIEW_TEMPLATES_BUYER_DEMO_USE_HINT,
  SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT,
  SPECIALTY_REVIEW_TEMPLATES_RELATED_LINKS,
  SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL,
  specialtyReviewTemplatesCompareHref,
  type SpecialtyReviewCloudContext,
  type SpecialtyReviewTemplateId,
} from "@/lib/specialty-review-templates";
import {
  parseSpecialtyWalkthroughCloudFromSearch,
  parseSpecialtyWalkthroughTemplateFromSearch,
  specialtyWalkthroughsSelectionHrefFromSearch,
} from "@/lib/help/specialty-walkthroughs-selection-url";
import {
  parseSpecialtyWalkthroughTemplatePreviewFromSearch,
  specialtyWalkthroughTemplatePreviewHrefFromSearch,
} from "@/lib/help/specialty-walkthrough-template-preview-url";

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
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const capabilityCanExecute = useOperateCapability();
  const canExecute = buyerPolishedShell ? true : capabilityCanExecute;
  const router = useRouter();
  const pathname = usePathname() ?? SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const navigation = useReviewIntakeNavigation();
  const cloudContextFieldsetId = useId();
  const [selectedTemplateId, setSelectedTemplateIdState] = useState<SpecialtyReviewTemplateId | null>(() =>
    parseSpecialtyWalkthroughTemplateFromSearch(searchParams.get("template")),
  );
  const [preview, setPreviewState] = useState<SpecialtyTemplatePreviewState | null>(() => {
    const templateId = parseSpecialtyWalkthroughTemplatePreviewFromSearch(searchParams.get("templatePreview"));

    if (templateId === null) {
      return null;
    }

    const template = findSpecialtyReviewTemplate(templateId);

    return template === undefined ? null : { template };
  });
  const [saasCloudContext, setSaasCloudContextState] = useState<SpecialtyReviewCloudContext>(() =>
    parseSpecialtyWalkthroughCloudFromSearch(searchParams.get("cloud")),
  );

  const syncSelectionToUrl = useCallback(
    (patch: {
      readonly templateId?: SpecialtyReviewTemplateId | null;
      readonly cloudContext?: SpecialtyReviewCloudContext;
    }) => {
      router.replace(specialtyWalkthroughsSelectionHrefFromSearch(searchParams.toString(), patch, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSelectedTemplateId = useCallback(
    (templateId: SpecialtyReviewTemplateId | null) => {
      setSelectedTemplateIdState(templateId);
      syncSelectionToUrl({ templateId });
    },
    [syncSelectionToUrl],
  );

  const setSaasCloudContext = useCallback(
    (cloudContext: SpecialtyReviewCloudContext) => {
      setSaasCloudContextState(cloudContext);
      syncSelectionToUrl({ cloudContext });
    },
    [syncSelectionToUrl],
  );

  const syncTemplatePreviewToUrl = useCallback(
    (templateId: SpecialtyReviewTemplateId | null) => {
      router.replace(
        specialtyWalkthroughTemplatePreviewHrefFromSearch(searchParams.toString(), templateId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPreview = useCallback(
    (value: SpecialtyTemplatePreviewState | null) => {
      setPreviewState(value);
      syncTemplatePreviewToUrl(value?.template.id ?? null);
    },
    [syncTemplatePreviewToUrl],
  );

  useEffect(() => {
    setSelectedTemplateIdState(parseSpecialtyWalkthroughTemplateFromSearch(searchParams.get("template")));
    setSaasCloudContextState(parseSpecialtyWalkthroughCloudFromSearch(searchParams.get("cloud")));

    const templateId = parseSpecialtyWalkthroughTemplatePreviewFromSearch(searchParams.get("templatePreview"));

    if (templateId === null) {
      setPreviewState(null);

      return;
    }

    const template = findSpecialtyReviewTemplate(templateId);

    if (template === undefined) {
      setPreviewState(null);

      return;
    }

    setPreviewState((current) =>
      current?.template.id === template.id ? current : { template },
    );
  }, [searchParams]);

  const selectedTemplate = useMemo(
    () => (selectedTemplateId === null ? null : findSpecialtyReviewTemplate(selectedTemplateId) ?? null),
    [selectedTemplateId],
  );

  const handleSelect = useCallback(
    (templateId: SpecialtyReviewTemplateId) => {
      setSelectedTemplateId(templateId);
    },
    [setSelectedTemplateId],
  );

  const handleRemoveSelection = useCallback(() => {
    setSelectedTemplateId(null);
  }, [setSelectedTemplateId]);

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
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const pageSubtitle = specialtyWalkthroughsHelpPageSubtitle(buyerPolishedShell);

  const startHerePanel = (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-specialty-walkthroughs-action-panel"
      aria-labelledby="help-specialty-walkthroughs-action-panel-heading"
    >
      <h2
        id="help-specialty-walkthroughs-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {SPECIALTY_WALKTHROUGHS_HELP_START_HERE_CARD_TITLE}
      </h2>
      {buyerPolishedShell ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SPECIALTY_REVIEW_TEMPLATES_BUYER_DEMO_USE_HINT}
        </p>
      ) : (
        <Button asChild size="sm" variant="primary" data-testid={SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.testId}>
          <Link href={SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.href}>
            {SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      )}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href="/architecture/reviews/new" className={cn(OPERATOR_LINK.inline)}>
          {SPECIALTY_REVIEW_TEMPLATES_USE_STANDARD_REVIEW_LABEL}
        </Link>
        {" — "}
        {SPECIALTY_REVIEW_TEMPLATES_OPTIONAL_NOTE}
      </p>
    </section>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-specialty-walkthrough-templates"
      aria-busy={navigation.isNavigating}
    >
      {buyerPolishedShell ? (
        <a
          href={`#${SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {SPECIALTY_WALKTHROUGHS_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      <div
        id={SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_CONTENT_ID}
        data-testid={SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={SPECIALTY_WALKTHROUGHS_HELP_PAGE_TITLE}
            titleTestId="help-specialty-walkthroughs-page-title"
            subtitle={pageSubtitle}
            navHref={SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={SPECIALTY_WALKTHROUGHS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={<HelpSpecialtyWalkthroughHeaderActions entry={entry} />}
          />
        ) : (
          <HelpTopicGuidePageHeader
            title={SPECIALTY_WALKTHROUGHS_HELP_PAGE_TITLE}
            titleTestId="help-specialty-walkthroughs-page-title"
            subtitle={pageSubtitle}
            navHref={SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
            actions={<HelpSpecialtyWalkthroughHeaderActions entry={entry} />}
          />
        )}

        {buyerPolishedShell ? (
          <div
            id={SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID}
            data-testid={SPECIALTY_WALKTHROUGHS_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <p className={readingBodyClass} data-testid="help-specialty-walkthroughs-overview">
              {SPECIALTY_WALKTHROUGHS_HELP_OVERVIEW}
            </p>
            {startHerePanel}
          </div>
        ) : (
          <>
            <p className={readingBodyClass} data-testid="help-specialty-walkthroughs-overview">
              {SPECIALTY_WALKTHROUGHS_HELP_OVERVIEW}
            </p>
            {startHerePanel}
            <HelpSpecialtyWalkthroughEvidenceOrientationStrip />
          </>
        )}

        <div className="space-y-4">
          {!canExecute && !buyerPolishedShell ? (
            <p
              id={SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
              className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}
              data-testid={SPECIALTY_TEMPLATE_READ_ONLY_HINT_ID}
            >
              {SPECIALTY_REVIEW_TEMPLATES_READ_ONLY_USE_HINT}
            </p>
          ) : null}

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
              id={SPECIALTY_WALKTHROUGHS_HELP_SKIP_TARGET_ID}
              aria-labelledby="specialty-template-catalog-heading"
              className="space-y-4"
              tabIndex={-1}
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
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-specialty-walkthroughs-orientation-bottom">
            <HelpSpecialtyWalkthroughClaimOrientationStrip />
          </div>
        ) : null}
      </div>

      <SpecialtyTemplatePreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </article>
  );
}
