import { appendMarketingAttributionToUrl } from "@/lib/marketing/append-marketing-attribution-to-url";

/** Owner-approved mailto subject when no booking URL is configured. */
export const WALKTHROUGH_REQUEST_MAILTO_SUBJECT = "ArchLucid Architecture Review — Walkthrough Request";

export type WalkthroughCtaEnv = {
  readonly bookingUrl: string;
  readonly mailtoFallback: string;
};

export function readWalkthroughCtaEnvFromProcess(): WalkthroughCtaEnv {
  return {
    bookingUrl: (process.env.NEXT_PUBLIC_WALKTHROUGH_BOOKING_URL ?? "").trim(),
    mailtoFallback: (process.env.NEXT_PUBLIC_WALKTHROUGH_MAILTO_FALLBACK ?? "").trim(),
  };
}

export function buildWalkthroughCtaHref(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  pageOrigin: string,
  env: WalkthroughCtaEnv = readWalkthroughCtaEnvFromProcess(),
): string {
  if (env.bookingUrl !== "") return appendMarketingAttributionToUrl(env.bookingUrl, searchParams, pageOrigin);

  const subject: string = encodeURIComponent(WALKTHROUGH_REQUEST_MAILTO_SUBJECT);

  if (env.mailtoFallback !== "") return `mailto:${env.mailtoFallback}?subject=${subject}`;

  return `mailto:?subject=${subject}`;
}
