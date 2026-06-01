import { type NextRequest, NextResponse } from "next/server";

import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

export type HelpArticleResponse = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  markdown: string;
};

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> },
): Promise<NextResponse<HelpArticleResponse | { error: string }>> {
  const { slug } = await props.params;
  const loaded = tryLoadProductDocumentation(slug);

  if (loaded === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug,
    title: loaded.entry.title,
    summary: loaded.entry.summary,
    audience: loaded.entry.audience,
    markdown: loaded.markdown,
  });
}
