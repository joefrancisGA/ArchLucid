import type { MetadataRoute } from "next";

import { MARKETING_ROBOTS_DISALLOW_PREFIXES } from "@/lib/marketing/public-marketing-seo-paths";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

/** Canonical `robots.txt` for apex host (marketing + routed API paths). Disallow prefixes target operator/API noise, not RFC `Disallow: /`. */
export default function robots(): MetadataRoute.Robots {
  const baseUrl: URL = getSiteMetadataBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        disallow: [...MARKETING_ROBOTS_DISALLOW_PREFIXES],
      },
    ],
    sitemap: new URL("/sitemap.xml", baseUrl).href,
    host: baseUrl.hostname,
  };
}
