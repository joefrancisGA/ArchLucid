"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  HelpBillingCurrentPlanCard,
  type BillingPlanDataLoadState,
} from "@/app/(operator)/help/_sections/HelpBillingCurrentPlanCard";
import { HelpBillingAndPlansPageHeader } from "@/app/(operator)/help/_sections/HelpBillingAndPlansPageHeader";
import { HelpBillingAndPlansHeaderActions } from "@/app/(operator)/help/_sections/HelpBillingAndPlansHeaderActions";
import { HelpBillingAndPlansSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpBillingAndPlansSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { BillingAndPlansHelpClaimDisciplineStrip } from "@/components/help/BillingAndPlansHelpClaimDisciplineStrip";
import { BillingAndPlansHelpEvidenceOrientationStrip } from "@/components/help/BillingAndPlansHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  BILLING_HELP_FAQ_ITEMS,
  BILLING_HELP_GUIDE_HEADINGS,
  BILLING_HELP_HOW_BILLING_WORKS_ITEMS,
  BILLING_HELP_OVERVIEW,
  BILLING_HELP_REFRESH_ERROR_MESSAGE,
  BILLING_HELP_SUPPORT_ACTION,
  BILLING_HELP_SUPPORT_INTRO,
  billingHelpPageSubtitle,
  BILLING_HELP_PAGE_DISPLAY_TITLE,
  type BillingHelpFaqItem,
} from "@/lib/billing-help-guide-content";
import {
  BILLING_AND_PLANS_HELP_CANONICAL_PATH,
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE,
  BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID,
} from "@/lib/billing-and-plans-help-evidence-copy";
import {
  BILLING_HELP_FIRST_VIEWPORT_TEST_ID,
  BILLING_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BILLING_HELP_PRIMARY_CONTENT_ID,
  BILLING_HELP_SKIP_LINK_LABEL,
  BILLING_HELP_SKIP_TARGET_ID,
} from "@/lib/billing-and-plans-help-page-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { showError } from "@/lib/toast";

type HelpBillingAndPlansGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, HELP_PAGE_LAYOUT.compactSectionH2, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function BillingFaqItemCard(props: { readonly item: BillingHelpFaqItem }): React.ReactElement {
  const { item } = props;

  return (
    <details
      id={item.id}
      className={cn(
        "group rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm open:shadow-md dark:border-neutral-800 dark:bg-neutral-950",
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
      )}
      data-testid={`help-billing-faq-${item.id}`}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-start justify-between gap-3 marker:content-none [&::-webkit-details-marker]:hidden",
          HELP_PAGE_LAYOUT.readingBody,
          "font-medium text-al-text-primary",
        )}
      >
        <span className="font-medium text-al-text-primary">{item.question}</span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180 dark:text-neutral-400"
          aria-hidden
        />
      </summary>
      <p className={cn("m-0 mt-3 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}>{item.answer}</p>
    </details>
  );
}

/** Buyer-safe billing orientation for `/help/billing-and-plans`. */
export function HelpBillingAndPlansGuideView(props: HelpBillingAndPlansGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handlePlanLoadStateChange = useCallback((state: BillingPlanDataLoadState) => {
    if (state.status === "pending") {
      return;
    }

    if (state.status === "resolved") {
      setLastRefreshedAt(new Date());
      setRefreshError(null);
      setRefreshing(false);
      return;
    }

    setRefreshing((wasRefreshing) => {
      if (wasRefreshing) {
        setRefreshError(BILLING_HELP_REFRESH_ERROR_MESSAGE);
        showError("Billing", BILLING_HELP_REFRESH_ERROR_MESSAGE);
      }

      return false;
    });
  }, []);

  const contentGridClass = resolveHelpPageContentGridClass(BILLING_HELP_GUIDE_HEADINGS.length);
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-billing-and-plans",
    BILLING_HELP_GUIDE_HEADINGS,
    BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID,
  );

  const tocHeadings = buyerPolishedShell
    ? guideHeadings.filter((heading) => heading.id !== "where-to-go-next")
    : guideHeadings;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);

    try {
      // The card reads both probes from these keys and reports freshness through onLoadStateChange.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: operatorQueryKeys.tenantTrialStatus }),
        queryClient.refetchQueries({ queryKey: operatorQueryKeys.tenantUsageStatus }),
      ]);
    } catch {
      setRefreshError(BILLING_HELP_REFRESH_ERROR_MESSAGE);
      showError("Billing", BILLING_HELP_REFRESH_ERROR_MESSAGE);
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-billing-and-plans-guide"
    >
      <a href={`#${BILLING_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {BILLING_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={BILLING_HELP_PRIMARY_CONTENT_ID}
        data-testid={BILLING_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={BILLING_HELP_PAGE_DISPLAY_TITLE}
            titleTestId="help-billing-page-title"
            subtitle={billingHelpPageSubtitle(buyerPolishedShell)}
            navHref={BILLING_AND_PLANS_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={BILLING_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={
              <HelpBillingAndPlansHeaderActions
                refreshing={refreshing}
                onRefresh={() => {
                  void onRefresh();
                }}
              />
            }
            metadata={
              refreshError !== null ? (
                <span
                  className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="help-billing-refresh-error"
                >
                  {refreshError}
                </span>
              ) : undefined
            }
          />
        ) : (
          <HelpBillingAndPlansPageHeader
            entry={entry}
            subtitle={billingHelpPageSubtitle(buyerPolishedShell)}
            refreshing={refreshing}
            lastRefreshedAt={lastRefreshedAt}
            refreshError={refreshError}
            onRefresh={() => {
              void onRefresh();
            }}
          />
        )}

        {!buyerPolishedShell ? <BillingAndPlansHelpClaimDisciplineStrip /> : null}

        <div
          id={BILLING_HELP_SKIP_TARGET_ID}
          data-testid={BILLING_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            buyerPolishedShell ? "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800" : "space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            buyerPolishedShell ? OPERATOR_LAYOUT.sectionStack : undefined,
          )}
        >
          <HelpBillingCurrentPlanCard onLoadStateChange={handlePlanLoadStateChange} />
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "max-w-[75ch] space-y-6 xl:max-w-none")}>
            <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-billing-overview">
              {BILLING_HELP_OVERVIEW}
            </p>

            <section
              aria-labelledby="how-billing-works"
              className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-billing-works">How billing works</HelpSectionHeading>
              <ul
                className={cn("m-0 list-none space-y-3 p-0", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-billing-how-it-works"
              >
                {BILLING_HELP_HOW_BILLING_WORKS_ITEMS.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
                  >
                    <h3 className={cn("m-0", HELP_PAGE_LAYOUT.sectionH3)}>{item.title}</h3>
                    <p className={cn("m-0 mt-1 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}>{item.body}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="common-questions"
              className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            >
              <HelpSectionHeading id="common-questions">Common questions</HelpSectionHeading>
              <p className={cn("m-0", HELP_PAGE_LAYOUT.paragraph, "text-al-text-secondary")}>
                Expand a question for a short answer and where to go next in the product.
              </p>
              <div className="space-y-3" data-testid="help-billing-faq-list">
                {BILLING_HELP_FAQ_ITEMS.map((item) => (
                  <BillingFaqItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            <section
              aria-labelledby="support"
              className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            >
              <HelpSectionHeading id="support">Support</HelpSectionHeading>
              <div
                className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                data-testid="help-billing-support-card"
              >
                <h2 className={cn("m-0", HELP_PAGE_LAYOUT.sectionH3)}>Billing support</h2>
                <p className={cn("m-0 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}>
                  {BILLING_HELP_SUPPORT_INTRO}
                </p>
                <Button asChild size="sm" variant="outline">
                  <a href={BILLING_HELP_SUPPORT_ACTION.href}>{BILLING_HELP_SUPPORT_ACTION.label}</a>
                </Button>
                <Link
                  href="/administration/billing"
                  className={cn("inline-block", OPERATOR_BODY_INLINE_LINK_CLASS)}
                >
                  Open Billing and plans
                </Link>
              </div>
            </section>

            {!buyerPolishedShell ? <BillingAndPlansHelpEvidenceOrientationStrip /> : null}
          </div>

          <HelpTopicTableOfContents headings={tocHeadings} />
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-billing-orientation-bottom">
            <HelpBillingAndPlansSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
