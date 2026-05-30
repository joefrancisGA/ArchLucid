import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpTopicMarkdownView } from "../HelpTopicMarkdownView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";

type HelpTopicPageProps = {
  params: Promise<{ topic: string }>;
};

export async function generateStaticParams(): Promise<Array<{ topic: string }>> {
  return listProductDocumentationEntries().map((entry) => ({ topic: entry.slug }));
}

export async function generateMetadata(props: HelpTopicPageProps): Promise<Metadata> {
  const { topic } = await props.params;
  const loaded = tryLoadProductDocumentation(topic);

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
  const loaded = tryLoadProductDocumentation(topic);

  if (loaded === null) {
    notFound();
  }

  return <HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />;
}
