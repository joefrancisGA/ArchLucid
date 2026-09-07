import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { productLineWordmarkAriaLabel } from "@/lib/product-line/product-line-display-name";

export const PRODUCT_LINE_ENV_NAME = "NEXT_PUBLIC_ARCHLUCID_PRODUCT";

export const PRODUCT_LINE_LABELS: Record<ProductLineId, string> = {
  architecture: "Architecture",
  security: "Security",
};

export const PRODUCT_LINE_WORDMARK_ARIA_LABEL: Record<ProductLineId, string> = {
  architecture: productLineWordmarkAriaLabel("architecture"),
  security: productLineWordmarkAriaLabel("security"),
};

export const SECURITY_PRODUCT_HOME_TITLE = "Infrastructure evidence";

export const SECURITY_PRODUCT_HOME_SUBTITLE =
  "Cloud inventory, drift, diagrams, grounded Ask, and remediation.";

export const SECURITY_PRODUCT_HOME_CLAIM_DISCIPLINE =
  "This shell does not run architecture reviews, sealed manifests, or approval queues. Inventory collection still uses the shared platform.";

export const PRODUCT_LINE_PLAYGROUND_TITLE = "Product line";

export const PRODUCT_LINE_PLAYGROUND_SUBTITLE =
  "Assign each sidebar destination to Architecture, Security, or both. Changes stay in this browser until you reset.";

export const PRODUCT_LINE_PLAYGROUND_DUAL_START_NOTE =
  "Dual local start uses two Next.js windows: Architecture on port 3000 and Security on port 3001. Deep links to architecture-only routes bounce on the Security window — use the matching port.";

export const ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE = "Architecture home runs on the other local port";

export const ARCHITECTURE_HOME_SECURITY_ENV_HINT_BODY =
  "This Next.js process is the Security shell. Open the Architecture window from start-local-api-and-ui.ps1, or switch back below.";
