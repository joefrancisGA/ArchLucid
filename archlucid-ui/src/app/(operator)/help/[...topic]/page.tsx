import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { HelpTopicMarkdownView } from "../HelpTopicMarkdownView";
import { HelpAlertsGuideView } from "../_sections/HelpAlertsGuideView";
import { HelpFindingsGuideView } from "../_sections/HelpFindingsGuideView";
import { HelpGovernanceApprovalGuideView } from "../_sections/HelpGovernanceApprovalGuideView";
import { HelpCorePilotGuideView } from "../_sections/HelpCorePilotGuideView";
import { HelpSpecialtyWalkthroughTemplatesView } from "../_sections/HelpSpecialtyWalkthroughTemplatesView";
import { HelpGettingStartedGuideView } from "../_sections/HelpGettingStartedGuideView";
import { HelpHowArchLucidWorksGuideView } from "../_sections/HelpHowArchLucidWorksGuideView";
import { HelpTopicAuthorityGate } from "../_sections/HelpTopicAuthorityGate";
import { HelpTopicMarkdownClient } from "../_sections/HelpTopicMarkdownClient";
import { HelpTopicNotFoundView } from "../_sections/HelpTopicNotFoundView";
import { HelpTroubleshootingGuideView } from "../_sections/HelpTroubleshootingGuideView";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
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
};

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

function renderHelpTopicView(loaded: NonNullable<ReturnType<typeof tryLoadProductDocumentation>>): React.ReactElement {
  if (loaded.entry.slug === "core-pilot") {
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

  if (loaded.entry.slug === "findings") {
    return <HelpFindingsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "governance-approval") {
    return <HelpGovernanceApprovalGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "specialty-walkthroughs") {
    return <HelpSpecialtyWalkthroughTemplatesView entry={loaded.entry} />;
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

  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function HelpTopicPage(props: HelpTopicPageProps): Promise<React.ReactElement> {
  const { topic } = await props.params;
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
          {renderHelpTopicView(loaded)}
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

  return renderHelpTopicView(loaded);
}
