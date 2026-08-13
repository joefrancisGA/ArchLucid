import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-guide-content";
import { ACCELERATOR_CHOOSER_HELP_PATH } from "@/lib/accelerator-chooser-help-route";

/** Registry slug for home inbound guidance — must match specialty help dispatch (TB-1608). */
export const ACCELERATOR_CHOOSER_HOME_HELP_SLUG = "accelerator-chooser" as const;

/** Home card title aligned with `/help/accelerator-chooser` specialty chrome (TB-1608). */
export const ACCELERATOR_CHOOSER_HOME_CARD_TITLE = ACCELERATOR_CHOOSER_HELP_PAGE_TITLE;

/** Buyer-safe lead — no repository / engineering location jargon (TB-1608). */
export const ACCELERATOR_CHOOSER_HOME_CARD_LEAD =
  "Choose the buyer job that matches your next review — each row preloads a starter architecture request and matching policy packs.";

/** Home guidance link label — not internal “accelerator chooser” engineering wording (TB-1608). */
export const ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL = "Open the accelerator pack guide";

/** Canonical help destination for the home guidance link (TB-1608). */
export const ACCELERATOR_CHOOSER_HOME_GUIDANCE_HREF = ACCELERATOR_CHOOSER_HELP_PATH;
