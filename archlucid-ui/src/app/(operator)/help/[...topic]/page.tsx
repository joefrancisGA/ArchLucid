import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpTopicMarkdownView } from "../HelpTopicMarkdownView";
import { HelpCorePilotGuideView } from "../_sections/HelpCorePilotGuideView";
import { HelpGettingStartedGuideView } from "../_sections/HelpGettingStartedGuideView";
import { HelpHowArchLucidWorksGuideView } from "../_sections/HelpHowArchLucidWorksGuideView";
import { HelpTroubleshootingGuideView } from "../_sections/HelpTroubleshootingGuideView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  HELP_TOPIC_SLUG_ALIASES,
  listProductDocumentationEntries,
} from "@/lib/product-documentation-registry";

type HelpTopicPageProps = {
  params: Promise<{ topic: string[] }>;
};

function helpSlugFromTopicSegments(topic: string[]): string {
  return topic.map((segment) => segment.trim()).filter((segment) => segment.length > 0).join("/");
}

export async function generateStaticParams(): Promise<Array<{ topic: string[] }>> {
  const registryParams = listProductDocumentationEntries().map((entry) => ({ topic: [entry.slug] }));
  const aliasParams = Object.keys(HELP_TOPIC_SLUG_ALIASES).map((alias) => ({
    topic: alias.split("/"),
  }));

  return [...registryParams, ...aliasParams];
}

export async function generateMetadata(props: HelpTopicPageProps): Promise<Metadata> {
  const { topic } = await props.params;
  const loaded = tryLoadProductDocumentation(helpSlugFromTopicSegments(topic));

  if (loaded === null) {
    return { title: "Help topic not found" };
  }

  return {
    title: loaded.entry.title,
    description: loaded.entry.summary,
  };
}

export default async function HelpTopicPage(props: HelpTopicPageProps): Promise<React.ReactElement> {
  const { topic } = await props.params;
  const loaded = tryLoadProductDocumentation(helpSlugFromTopicSegments(topic));

  if (loaded === null) {
    notFound();
  }

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

  return <HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />;
}
