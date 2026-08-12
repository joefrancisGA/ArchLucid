import type { Metadata } from "next";

import {

  BUYER_ONBOARDING_PAGE_LEAD,

  BUYER_ONBOARDING_PAGE_TITLE,

} from "@/lib/buyer/buyer-polish-copy";

/**

 * Canonical first-review onboarding hub — operator surface, not a marketing landing page.

 */

export const FIRST_REVIEW_GUIDE_ROUTE_METADATA: Metadata = {

  title: BUYER_ONBOARDING_PAGE_TITLE,

  description: BUYER_ONBOARDING_PAGE_LEAD,

  robots: { index: false, follow: false },

};

