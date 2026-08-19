import type { MetadataRoute } from "next";

import { MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

/** Indexable marketing pages only (`metadata.robots`/noindex pages such as `/live-demo` stay out deliberately). */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl: URL = getSiteMetadataBaseUrl();

  function priorityForPath(pathname: string): number {
    if (pathname === "/welcome") {
      return 1;
    }

    if (pathname === "/pricing") {
      return 0.9;
    }

    return 0.65;
  }

  return MARKETING_SITEMAP_PATHNAMES.map((pathname) => ({
    url: new URL(pathname, baseUrl).href,
    changeFrequency: "weekly" as const,
    priority: priorityForPath(pathname),
  }));
}
