import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { HelpTopicMarkdownView } from "../HelpTopicMarkdownView";
import { HelpAlertsGuideView } from "../_sections/HelpAlertsGuideView";
import { HelpBillingAndPlansGuideView } from "../_sections/HelpBillingAndPlansGuideView";
import { HelpExecutiveSummaryGuideView } from "../_sections/HelpExecutiveSummaryGuideView";
import { HelpFindingsGuideView } from "../_sections/HelpFindingsGuideView";
import { HelpGlossaryPageView } from "../_sections/HelpGlossaryPageView";
import { HelpUsersAndRolesGuideView } from "../_sections/HelpUsersAndRolesGuideView";
import { HelpCliUsageTechnicalReferenceView } from "../_sections/HelpCliUsageTechnicalReferenceView";
import { HelpGovernanceApprovalGuideView } from "../_sections/HelpGovernanceApprovalGuideView";
import { HelpAzurePermissionsGuideView } from "../_sections/HelpAzurePermissionsGuideView";
import { HelpAuditTrailGuideView } from "../_sections/HelpAuditTrailGuideView";
import { HelpConnectAzureSecurelyGuideView } from "../_sections/HelpConnectAzureSecurelyGuideView";
import { HelpCorePilotGuideView } from "../_sections/HelpCorePilotGuideView";
import { HelpRepeatReviewLoopGuideView } from "../_sections/HelpRepeatReviewLoopGuideView";
import { HelpSpecialtyWalkthroughTemplatesView } from "../_sections/HelpSpecialtyWalkthroughTemplatesView";
import { HelpGettingStartedGuideView } from "../_sections/HelpGettingStartedGuideView";
import { HelpHowArchLucidWorksGuideView } from "../_sections/HelpHowArchLucidWorksGuideView";
import { HelpTopicAuthorityGate } from "../_sections/HelpTopicAuthorityGate";
import { HelpTopicMarkdownClient } from "../_sections/HelpTopicMarkdownClient";
import { HelpTopicNotFoundView } from "../_sections/HelpTopicNotFoundView";
import { HelpTroubleshootingGuideView } from "../_sections/HelpTroubleshootingGuideView";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import { BILLING_AND_PLANS_HELP_ROUTE_METADATA } from "@/lib/billing-and-plans-help-route-metadata";
import { EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA } from "@/lib/executive-summary-help-route-metadata";
import { FINDINGS_HELP_ROUTE_METADATA } from "@/lib/findings-help-route-metadata";
import { FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-architecture-review-help-route-metadata";
import { GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA } from "@/lib/governance-approval-help-route-metadata";
import { PATH_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/path-chooser-help-route-metadata";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  getProductDocumentationEntry,
  HELP_TOPIC_SLUG_ALIASES,
  listProductDocumentationEntries,
} from "@/lib/product-documentation-registry";
import { getInboundAuthenticatedServerPrincipal } from "@/lib/server-current-principal";

export const dynamic = "force-dynamic";

type HelpTopicPageProps = {
  params: Promise<{ topic: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const value = searchParams?.[key];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

function resolveAzurePermissionsReturnHref(returnTo: string | undefined): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections";
}

function helpSlugFromTopicSegments(topic: string[]): string {
  return topic.map((segment) => segment.trim()).filter((segment) => segment.length > 0).join("/");
}

export async function generateStaticParams(): Promise<Array<{ topic: string[] }>> {
  const registryParams = listProductDocumentationEntries()
    .filter((entry) => entry.contentKind !== "internal-runbook")
    .map((entry) => ({ topic: [entry.slug] }));
  const aliasParams = Object.keys(HELP_TOPIC_SLUG_ALIASES).map((alias) => ({
    topic: alias.split("/"),
  }));

  return [...registryParams, ...aliasParams];
}

function renderHelpTopicView(
  loaded: NonNullable<ReturnType<typeof tryLoadProductDocumentation>>,
  searchParams?: Record<string, string | string[] | undefined>,
): React.ReactElement {
  if (loaded.entry.slug === "first-architecture-review") {
    return <HelpCorePilotGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "getting-started") {
    return <HelpGettingStartedGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "how-it-works") {
    return <HelpHowArchLucidWorksGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "troubleshooting") {
    return <HelpTroubleshootingGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "alerts") {
    return <HelpAlertsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "billing-and-plans") {
    return <HelpBillingAndPlansGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "executive-summary") {
    return <HelpExecutiveSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "findings") {
    return <HelpFindingsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "governance-approval") {
    return <HelpGovernanceApprovalGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cli-usage") {
    return <HelpCliUsageTechnicalReferenceView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "glossary") {
    return <HelpGlossaryPageView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "users-and-roles") {
    return <HelpUsersAndRolesGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cloud-connections-azure") {
    return (
      <HelpConnectAzureSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "azure-permissions") {
    return (
      <HelpAzurePermissionsGuideView
        entry={loaded.entry}
        subscriptionId={readSearchParam(searchParams, "subscriptionId")}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "specialty-walkthroughs") {
    return <HelpSpecialtyWalkthroughTemplatesView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "repeat-review-loop") {
    return <HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "audit-trail") {
    return <HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  return <HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />;
}

export async function generateMetadata(props: HelpTopicPageProps): Promise<Metadata> {
  const { topic } = await props.params;
  const entry = getProductDocumentationEntry(helpSlugFromTopicSegments(topic));

  if (entry === null) {
    return { title: "Help topic not found" };
  }

  if (entry.contentKind === "internal-runbook") {
    return { title: "Help topic not found" };
  }

  if (entry.slug === "first-architecture-review") {
    return FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "billing-and-plans") {
    return BILLING_AND_PLANS_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "executive-summary") {
    return EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "findings") {
    return FINDINGS_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "governance-approval") {
    return GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "path-chooser") {
    return PATH_CHOOSER_HELP_ROUTE_METADATA;
  }

  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function HelpTopicPage(props: HelpTopicPageProps): Promise<React.ReactElement> {
  const { topic } = await props.params;
  const resolvedSearchParams = props.searchParams !== undefined ? await props.searchParams : undefined;
  const slug = helpSlugFromTopicSegments(topic);
  const entry = getProductDocumentationEntry(slug);

  if (entry === null) {
    notFound();
  }

  if (entry.contentKind === "internal-runbook") {
    const inboundAuthorization = (await headers()).get("authorization")?.trim() ?? "";

    if (inboundAuthorization.length > 0) {
      const principal = await getInboundAuthenticatedServerPrincipal();

      if (!principalCanAccessHelpTopic(entry, principal)) {
        notFound();
      }

      const loaded = tryLoadProductDocumentation(slug);

      if (loaded === null) {
        notFound();
      }

      return (
        <HelpTopicAuthorityGate entry={entry} denied={<HelpTopicNotFoundView />}>
          {renderHelpTopicView(loaded, resolvedSearchParams)}
        </HelpTopicAuthorityGate>
      );
    }

    return (
      <HelpTopicAuthorityGate entry={entry} denied={<HelpTopicNotFoundView />}>
        <HelpTopicMarkdownClient entry={entry} />
      </HelpTopicAuthorityGate>
    );
  }

  const loaded = tryLoadProductDocumentation(slug);

  if (loaded === null) {
    notFound();
  }

  return renderHelpTopicView(loaded, resolvedSearchParams);
}
