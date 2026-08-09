"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HelpBillingCurrentPlanCard } from "@/app/(operator)/help/_sections/HelpBillingCurrentPlanCard";
import { HelpBillingAndPlansPageHeader } from "@/app/(operator)/help/_sections/HelpBillingAndPlansPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  BILLING_HELP_FAQ_ITEMS,
  BILLING_HELP_HOW_BILLING_WORKS_ITEMS,
  BILLING_HELP_OVERVIEW,
  BILLING_HELP_SUPPORT_ACTION,
  BILLING_HELP_SUPPORT_INTRO,
  billingHelpPageSubtitle,
  type BillingHelpFaqItem,
} from "@/lib/billing-help-guide-content";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { fetchTenantUsageStatusCached } from "@/lib/tenant-usage-status-client";
type HelpBillingAndPlansGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
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
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        <span className="font-medium text-al-text-primary">{item.question}</span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180 dark:text-neutral-400"
          aria-hidden
        />
      </summary>
      <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{item.answer}</p>
    </details>
  );
}

/** Buyer-safe billing orientation for `/help/billing-and-plans`. */
export function HelpBillingAndPlansGuideView(props: HelpBillingAndPlansGuideViewProps): React.ReactElement {
  void props.entry;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setLastRefreshedAt(new Date());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.tenantTrialStatus });
      await fetchTenantUsageStatusCached({ force: true });
      setRefreshToken((previous) => previous + 1);
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-billing-and-plans-guide"
    >
      <HelpTopicHashScroll />

      <HelpBillingAndPlansPageHeader
        subtitle={billingHelpPageSubtitle(buyerPolishedShell)}
        refreshing={refreshing}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={() => {
          void onRefresh();
        }}
      />
      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <HelpBillingCurrentPlanCard refreshToken={refreshToken} />
      </div>

      <div className="max-w-[42rem] space-y-8 lg:max-w-none">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-billing-overview">
            {BILLING_HELP_OVERVIEW}
          </p>

        <section
          aria-labelledby="how-billing-works"
          className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
        >
          <HelpSectionHeading id="how-billing-works">How billing works</HelpSectionHeading>
          <ul className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-billing-how-it-works">
            {BILLING_HELP_HOW_BILLING_WORKS_ITEMS.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              >
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{item.title}</h3>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="common-questions"
          className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
        >
          <HelpSectionHeading id="common-questions">Common questions</HelpSectionHeading>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
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
          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-billing-support-card">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>Billing support</CardTitle>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{BILLING_HELP_SUPPORT_INTRO}</p>
            </CardHeader>
            <CardContent className={OPERATOR_CARD.content}>
              <Button asChild size="sm" variant="outline">
                <a href={BILLING_HELP_SUPPORT_ACTION.href}>{BILLING_HELP_SUPPORT_ACTION.label}</a>
              </Button>
              <Link
                href="/administration/billing"
                className={cn(
                  "mt-3 inline-block text-sm underline-offset-2 hover:underline",
                  DESIGN_TOKENS.accent.link,
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                Open Billing and plans
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </article>
  );
}
