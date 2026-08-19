import type { HelpArticleResponse } from "@/app/api/help/[slug]/route";
import { ensureAccessTokenFresh, getAccessTokenForApi } from "@/lib/oidc/session";

/** Loads in-app help markdown for a documentation slug. */
export async function fetchHelpTopicMarkdown(slug: string): Promise<string> {
  await ensureAccessTokenFresh();
  const headers = new Headers({ Accept: "application/json" });
  const bearer = getAccessTokenForApi();

  if (bearer !== undefined && bearer !== null && bearer.trim().length > 0) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }

  const response = await fetch(`/api/help/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const article = (await response.json()) as HelpArticleResponse;

  return article.markdown;
}
