"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_HELP_SPONSOR_STEP_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getShowcaseSponsorHref } from "@/lib/buyer/buyer-safe-review-navigation";
import {
  filterHelpCenterTopicsByQuery,
  getHelpCenterDisplay,
  getHelpCenterTier,
  HELP_CENTER_FEATURED_SLUGS,
  listHelpCenterAdvancedGuideTopics,
  listHelpCenterGuideTopics,
} from "@/lib/help/help-center-catalog";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { inAppHelpHref, type ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/**
 * Static, immediately-rendered product help (no fetch). Developer doc index is secondary in HelpDocsClient.
 */
export function HelpProductGuide() {
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [topicQuery, setTopicQuery] = useState("");

  const topicFilters = useMemo(
    () => ({
      showAdvanced,
      isAdmin,
      isInternalOperator: isArchLucidInternalOperatorShellEnv(),
    }),
    [isAdmin, showAdvanced],
  );

  const visibleTopics = useMemo(() => listHelpCenterGuideTopics(topicFilters), [topicFilters]);
  const filteredTopics = useMemo(
    () => filterHelpCenterTopicsByQuery(visibleTopics, topicQuery),
    [topicQuery, visibleTopics],
  );
  const advancedTopics = useMemo(() => listHelpCenterAdvancedGuideTopics(topicFilters), [topicFilters]);

  const featuredTopics = filteredTopics.filter((entry) => HELP_CENTER_FEATURED_SLUGS.includes(entry.slug));
  const expandedAdvancedTopics = filteredTopics.filter((entry) => advancedTopics.some((advanced) => advanced.slug === entry.slug));

  return (
    <div className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-product-guide-heading">
      <h2
        id="help-product-guide-heading"
        className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}
      >
        Using ArchLucid
      </h2>

      <Card className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Getting started</CardTitle>
        </CardHeader>
        <CardContent className={cn(OPERATOR_LAYOUT.controlClusterGap, OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("getting-started", "how-archlucid-works")}>
              How ArchLucid works
            </Link>{" "}
            — workflow from evidence through findings, governance, and exports.
          </p>
          <p className="m-0">
            <Link className={OPERATOR_LINK.inline} href="/faq">
              Product FAQ
            </Link>{" "}
            — evaluation, pricing, evidence, and security answers for architects and sponsors.
          </p>
          <ol className="m-0 list-decimal space-y-2 pl-5">
            <li>
              <Link className={OPERATOR_LINK.inline} href="/architecture/reviews/new">
                Start a review
              </Link>{" "}
              from a brief, diagram, document, or cloud evidence.
            </li>
            <li>Review findings and missing evidence.</li>
            <li>Commit the review.</li>
            <li>
              Open the <strong>evidence trail</strong>, <strong>audit trail</strong>, and{" "}
              <strong>signed review record</strong>.
            </li>
            <li>
              Share the{" "}
              <Link className={OPERATOR_LINK.inline} href={getShowcaseSponsorHref()}>
                sponsor report
              </Link>{" "}
              or{" "}
              <Link className={OPERATOR_LINK.inline} href="/insights/sponsor-report">
                value report
              </Link>
              .
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Working with a completed review</CardTitle>
        </CardHeader>
        <CardContent className={cn(OPERATOR_LAYOUT.controlClusterGap, OPERATOR_TYPOGRAPHY.body)}>
          <ol className="m-0 list-decimal space-y-2 pl-5">
            <li>
              <Link className={OPERATOR_LINK.inline} href={getShowcaseSponsorHref()}>
                {BUYER_HELP_SPONSOR_STEP_CTA}
              </Link>{" "}
              — start with the business decision and monitored risks.
            </li>
            <li>
              Open the <strong>signed review record</strong> — the immutable package locked when this review was finalized.
            </li>
            <li>
              Follow the{" "}
              <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("evidence-trail")}>
                evidence trail
              </Link>{" "}
              to see how findings tie to decisions and artifacts.
            </li>
            <li>
              Review{" "}
              <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("governance-approval")}>
                governance approval
              </Link>{" "}
              and the{" "}
              <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("audit-trail")}>
                audit trail
              </Link>{" "}
              for accountability.
            </li>
            <li>
              Use{" "}
              <Link className={OPERATOR_LINK.inline} href="/insights/ask-review-questions">
                Ask
              </Link>{" "}
              for evidence-backed questions in the context of the active review.
            </li>
          </ol>
        </CardContent>
      </Card>

      <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>
        ArchLucid turns an architecture review into a governed package: decisions, findings, artifacts, and an evidence
        trail you can export for diligence.
      </p>

      <Card className="border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className={cn(OPERATOR_LAYOUT.controlClusterGap, OPERATOR_TYPOGRAPHY.body)}>
          <p className={`m-0 ${OPERATOR_TYPOGRAPHY.cardTitle}`}>If something fails:</p>
          <ol className="m-0 list-decimal space-y-2 pl-5">
            <li>Refresh once.</li>
            <li>Check whether your session expired — return to{" "}
              <Link className={OPERATOR_LINK.inline} href="/auth/signin">
                Sign in
              </Link>{" "}
              if needed.
            </li>
            <li>Confirm the selected workspace.</li>
            <li>Download a support bundle (below).</li>
            <li>Contact your tenant admin or ArchLucid support.</li>
          </ol>
          <SupportBundleDownloadButton showDiagnosticsLink={isAdmin} />
          <p className="m-0 mt-3">
            <Link className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center")} href={inAppHelpHref("troubleshooting")}>
              Open full troubleshooting guide
            </Link>
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="help-in-app-topics" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="help-in-app-topics" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
              Guides
            </h3>
            <p className={`m-0 mt-1 ${OPERATOR_TYPOGRAPHY.helper}`}>
              Product help for common tasks. Expand for admin and integration guides.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={showAdvanced}
            onClick={() => {
              setShowAdvanced((current) => !current);
            }}
          >
            {showAdvanced ? "Hide advanced topics" : "Show advanced topics"}
          </Button>
        </div>

        <label className={cn("block", OPERATOR_TYPOGRAPHY.navLabel, "text-al-text-primary")} htmlFor="help-topic-search">
          Search guides
        </label>
        <input
          id="help-topic-search"
          type="search"
          value={topicQuery}
          onChange={(event) => {
            setTopicQuery(event.target.value);
          }}
          placeholder="Filter guides by title or summary"
          className={cn(
            "w-full max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.body,
          )}
          autoComplete="off"
        />

        <HelpTopicGrid topics={featuredTopics} heading="Start here" />

        {showAdvanced && expandedAdvancedTopics.length > 0 ? (
          <>
            <HelpTopicGrid
              topics={expandedAdvancedTopics.filter((entry) => getHelpCenterTier(entry) === "admin")}
              heading="Admin and integration"
            />
            <HelpTopicGrid
              topics={expandedAdvancedTopics.filter((entry) => getHelpCenterTier(entry) === "internal")}
              heading="System administration and engineering"
            />
            <HelpTopicGrid
              topics={expandedAdvancedTopics.filter((entry) => getHelpCenterTier(entry) === "product")}
              heading="More product guides"
            />
          </>
        ) : null}

        {filteredTopics.length === 0 ? (
          <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>No guides match your search.</p>
        ) : null}
      </section>
    </div>
  );
}

type HelpTopicGridProps = {
  topics: readonly ProductDocumentationEntry[];
  heading: string;
};

function HelpTopicGrid({ topics, heading }: HelpTopicGridProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
      <h4 className={`m-0 ${OPERATOR_NAV_GROUP_LABEL}`}>
        {heading}
      </h4>
      <ul className="m-0 grid gap-2 sm:grid-cols-2">
        {topics.map((topic) => {
          const display = getHelpCenterDisplay(topic);

          return (
            <li key={topic.slug}>
              <Link
                href={inAppHelpHref(topic.slug)}
                className={cn(
                  "block rounded-md border border-neutral-200 bg-white px-3 py-2 shadow-sm hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                <span className={OPERATOR_TYPOGRAPHY.cardTitle}>{display.title}</span>
                <span className={cn("mt-1 block", OPERATOR_TYPOGRAPHY.helper)}>{display.summary}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
