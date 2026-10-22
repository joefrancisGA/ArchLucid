import { INTERNAL_PRODUCT_LINE_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PRODUCT_LINE_PLAYGROUND_CLAIM_DISCIPLINE =
  "Product line assignments are browser-local playground state — not tenant configuration or a sealed deployment record." as const;

export const PRODUCT_LINE_PLAYGROUND_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const PRODUCT_LINE_PLAYGROUND_SOURCES_INTRO =
  "Reset assignments or open the matching local port before testing SecureNow-only routes." as const;

export const PRODUCT_LINE_PLAYGROUND_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture home", href: "/" },
  { label: "SecureNow infrastructure", href: "/infrastructure" },
  { label: "Internal health", href: "/internal/health" },
  { label: "Product line playground", href: INTERNAL_PRODUCT_LINE_PATH },
] as const;
