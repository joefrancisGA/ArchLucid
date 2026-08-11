import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH = "/help/accelerator-chooser" as const;

export const ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE =
  "This guide maps stakeholder scenarios to accelerator packs after a first finalized architecture review — architect orientation only, not a tenant diligence evidence bundle from your workspace. Open Path chooser, Your first architecture review, or a live architecture review when you need the next action.";

/** Compact scope line for the prerequisite card (HAX). */
export const ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE =
  "Architect orientation only — not an evidence bundle from your workspace.";

export const ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO =
  "Use these follow-ups when accelerator packs turn into path selection, a first review, or home starting points.";

/** Related next steps — no self-href to `/help/accelerator-chooser`. */
export const ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS: readonly EvidenceSourceLink[] = [
  { label: "Path chooser", href: inAppHelpHref("path-chooser") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Start a review", href: "/architecture/reviews/new" },
] as const;

/** @deprecated Use ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO */
export const ACCELERATOR_CHOOSER_HELP_SOURCES_INTRO = ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO;

/** @deprecated Use ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS */
export const ACCELERATOR_CHOOSER_HELP_SOURCES = ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS;
