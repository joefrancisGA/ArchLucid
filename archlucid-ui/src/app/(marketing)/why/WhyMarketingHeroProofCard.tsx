import Image from "next/image";
import Link from "next/link";

import { MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_HERO_PRIMARY_CTA_HREF,
  WHY_HERO_PRODUCT_SCREENSHOT_ALT,
  WHY_HERO_PRODUCT_SCREENSHOT_CAPTION,
  WHY_HERO_PRODUCT_SCREENSHOT_SRC,
} from "@/lib/why-page-copy";
import { cn } from "@/lib/utils";

/** Near-hero proof artifact — operator Home screenshot linked to the public proof slice. */
export function WhyMarketingHeroProofCard(): React.JSX.Element {
  return (
    <Link
      href={WHY_HERO_PRIMARY_CTA_HREF}
      className={cn(
        "group block overflow-hidden rounded-lg border border-neutral-200 bg-al-surface-raised text-left shadow-sm transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:bg-neutral-900",
        MARKETING_MOTION.heroVisual,
      )}
      data-testid="why-hero-proof-card"
      aria-label="See a finalized sample review — open the public proof slice"
    >
      <div className="relative aspect-[16/10] w-full bg-neutral-100 dark:bg-neutral-950">
        <Image
          src={WHY_HERO_PRODUCT_SCREENSHOT_SRC}
          alt={WHY_HERO_PRODUCT_SCREENSHOT_ALT}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover object-top"
          data-testid="why-hero-product-screenshot"
          priority
        />
      </div>
      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <p className={cn("m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          {WHY_HERO_PRODUCT_SCREENSHOT_CAPTION}
        </p>
        <p className={cn("m-0 mt-2", MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta)}>
          Inspect the full sample review →
        </p>
      </div>
    </Link>
  );
}
