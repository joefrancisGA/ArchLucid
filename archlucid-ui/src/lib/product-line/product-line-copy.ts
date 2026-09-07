import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { productLineWordmarkAriaLabel } from "@/lib/product-line/product-line-display-name";

export const PRODUCT_LINE_ENV_NAME = "NEXT_PUBLIC_ARCHLUCID_PRODUCT";

export const PRODUCT_LINE_LABELS: Record<ProductLineId, string> = {
  architecture: "Architecture",
  security: "SecureNow",
};

export const PRODUCT_LINE_WORDMARK_ARIA_LABEL: Record<ProductLineId, string> = {
  architecture: productLineWordmarkAriaLabel("architecture"),
  security: productLineWordmarkAriaLabel("security"),
};

export const SECURITY_PRODUCT_HOME_TITLE = "Infrastructure evidence";

export const SECURITY_PRODUCT_HOME_SUBTITLE =
  "Cloud inventory, drift, diagrams, grounded Ask, and remediation.";

export const PRODUCT_LINE_PLAYGROUND_TITLE = "Product line";

export const PRODUCT_LINE_PLAYGROUND_SUBTITLE =
  "Choose Architecture or SecureNow, then assign each sidebar destination. Changes stay in this browser until you reset.";

export const PRODUCT_LINE_NAV_TITLE =
  "Product line — choose Architecture or SecureNow and assign destinations";

export const PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL = "Open product line";

export const PRODUCT_LINE_PLAYGROUND_DUAL_START_NOTE =
  "Dual local start uses two Next.js windows: Architecture on port 3000 and SecureNow on port 3001. Deep links to architecture-only routes bounce on the SecureNow window — use the matching port.";

export const ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE = "Architecture home runs on the other local port";

export const ARCHITECTURE_HOME_SECURITY_ENV_HINT_BODY =
  "This Next.js process is the SecureNow shell. Open the Architecture window from start-local-api-and-ui.ps1, or open Product line under Internal.";
