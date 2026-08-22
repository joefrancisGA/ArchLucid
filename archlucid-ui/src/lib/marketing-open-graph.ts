import type { Metadata } from "next";

import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

/** Root/default social description aligned with POSITIONING.md and marketing JSON-LD (TB-253). */
export const MARKETING_ROOT_OG_DESCRIPTION =
  "Defensible architecture, on demand — turn scattered architecture evidence into a prioritized, evidence-linked review with traceability and exportable proof.";

export const MARKETING_WELCOME_OG_DESCRIPTION = "Defensible architecture, on demand.";

export const MARKETING_PRICING_OG_DESCRIPTION =
  "Transparent packaging for evidence-backed architecture review — request a demo or quote when you are ready to evaluate.";

export const MARKETING_WHY_OG_DESCRIPTION =
  "See how ArchLucid compares on AI orchestration, governance, and audit-ready evidence — grounded in shipped product capabilities.";

export const MARKETING_SEE_IT_OG_DESCRIPTION =
  "No-install sample architecture review: sponsor report, finalized review record, evidence trail, and export-ready outputs.";

export const MARKETING_FAQ_OG_DESCRIPTION =
  "Buyer-safe answers on evaluation, pricing, evidence, approval workflow, and assurance for architects and sponsors evaluating ArchLucid.";

const OG_IMAGE_PATH = "/logo/og-default.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export function buildMarketingOpenGraph(
  title: string,
  description: string,
  pathname: string,
): NonNullable<Metadata["openGraph"]> {
  const metadataBase = getSiteMetadataBaseUrl();
  const pageUrl = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, metadataBase);
  const imageUrl = new URL(OG_IMAGE_PATH, metadataBase);

  return {
    type: "website",
    locale: "en_US",
    siteName: "ArchLucid",
    title,
    description,
    url: pageUrl,
    images: [
      {
        url: imageUrl,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: "ArchLucid",
      },
    ],
  };
}

export function buildMarketingTwitter(
  title: string,
  description: string,
): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title,
    description,
    images: [OG_IMAGE_PATH],
  };
}

export function buildMarketingSocialMetadata(
  title: string,
  description: string,
  pathname: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: buildMarketingOpenGraph(title, description, pathname),
    twitter: buildMarketingTwitter(title, description),
  };
}
