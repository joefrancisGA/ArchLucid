import type { Metadata } from "next";
import { headers } from "next/headers";

import { HelpTopicAuthorityGate } from "../_sections/HelpTopicAuthorityGate";
import { HelpTopicMarkdownClient } from "../_sections/HelpTopicMarkdownClient";
import { HelpTopicNotFoundView } from "../_sections/HelpTopicNotFoundView";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import { BILLING_AND_PLANS_HELP_ROUTE_METADATA } from "@/lib/billing-and-plans-help-route-metadata";
import { SPONSOR_SUMMARY_HELP_ROUTE_METADATA } from "@/lib/sponsor/sponsor-report-help-route-metadata";
import { FINDINGS_HELP_ROUTE_METADATA } from "@/lib/findings/findings-help-route-metadata";
import { FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-architecture-review-help-route-metadata";
import { GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA } from "@/lib/governance/governance-approval-help-route-metadata";
import { CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA } from "@/lib/configuration-reference-help-route-metadata";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA } from "@/lib/data-handling-tenant-isolation-help-route-metadata";
import { DPA_TEMPLATE_HELP_ROUTE_METADATA } from "@/lib/dpa-template-help-route-metadata";
import { SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA } from "@/lib/soc2-self-assessment-help-route-metadata";
import { ACCELERATOR_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/accelerator-chooser-help-route-metadata";
import { PATH_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/path-chooser-help-route-metadata";
import { CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS } from "@/lib/cloud-connections-help-routes";
import {
  getProductDocumentationEntry,
  listProductDocumentationEntries,
} from "@/lib/product-documentation-registry";
import { getInboundAuthenticatedServerPrincipal } from "@/lib/server-current-principal";
import { loadHelpTopicContent } from "@/lib/help/help-topic-content-loader";
import { resolveHelpTopicView } from "@/lib/help/help-topic-view-resolver";
import { resolveInternalRunbookHelpRouteMetadata } from "@/lib/resolve-internal-runbook-help-route-metadata";

/** ISR for buyer help topics — keep in sync with `HELP_TOPIC_ROUTE_REVALIDATE_SECONDS` (TB-1600). */
export const revalidate = 3600;

type HelpTopicPageProps = {
  params: Promise<{ topic: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function helpSlugFromTopicSegments(topic: string[]): string {
  return topic.map((segment) => segment.trim()).filter((segment) => segment.length > 0).join("/");
}

export async function generateStaticParams(): Promise<Array<{ topic: string[] }>> {
  const registryParams = listProductDocumentationEntries()
    .filter((entry) => entry.contentKind !== "internal-runbook")
    .map((entry) => ({ topic: [entry.slug] }));
  const cloudHelpParams = CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS.map((segment) => ({
    topic: segment.split("/"),
  }));

  return [...registryParams, ...cloudHelpParams];
}

export async function generateMetadata(props: HelpTopicPageProps): Promise<Metadata> {
  const { topic } = await props.params;
  const entry = getProductDocumentationEntry(helpSlugFromTopicSegments(topic));

  if (entry === null) {
    return { title: "Help topic not found" };
  }

  if (entry.contentKind === "internal-runbook") {
    return resolveInternalRunbookHelpRouteMetadata(entry);
  }

  if (entry.slug === "first-architecture-review") {
    return FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "billing-and-plans") {
    return BILLING_AND_PLANS_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "sponsor-report") {
    return SPONSOR_SUMMARY_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "findings") {
    return FINDINGS_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "governance-approval") {
    return GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "choose-your-next-step") {
    return PATH_CHOOSER_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "accelerator-chooser") {
    return ACCELERATOR_CHOOSER_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "data-handling") {
    return DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "dpa-template") {
    return DPA_TEMPLATE_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "soc2-self-assessment") {
    return SOC2_SELF_ASSESSMENT_HELP_ROUTE_METADATA;
  }

  if (entry.slug === "configuration-reference") {
    return CONFIGURATION_REFERENCE_HELP_ROUTE_METADATA;
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
    return <HelpTopicNotFoundView />;
  }

  if (entry.contentKind === "internal-runbook") {
    const inboundAuthorization = (await headers()).get("authorization")?.trim() ?? "";

    if (inboundAuthorization.length > 0) {
      const principal = await getInboundAuthenticatedServerPrincipal();

      if (!principalCanAccessHelpTopic(entry, principal)) {
        return <HelpTopicNotFoundView />;
      }

      const loaded = loadHelpTopicContent(slug);

      if (loaded === null) {
        return <HelpTopicNotFoundView />;
      }

      return (
        <HelpTopicAuthorityGate entry={entry} denied={<HelpTopicNotFoundView />}>
          {resolveHelpTopicView(loaded, resolvedSearchParams)}
        </HelpTopicAuthorityGate>
      );
    }

    return (
      <HelpTopicAuthorityGate entry={entry} denied={<HelpTopicNotFoundView />}>
        <HelpTopicMarkdownClient entry={entry} />
      </HelpTopicAuthorityGate>
    );
  }

  const loaded = loadHelpTopicContent(slug);

  if (loaded === null) {
    return <HelpTopicNotFoundView />;
  }

  return resolveHelpTopicView(loaded, resolvedSearchParams);
}
