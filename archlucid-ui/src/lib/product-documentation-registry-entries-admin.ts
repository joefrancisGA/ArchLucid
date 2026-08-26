/**
 * Customer-visible in-app documentation registry entries (admin / developer).
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */

import type { ProductDocumentationRegistryInput } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_ADMIN: readonly ProductDocumentationRegistryInput[] = [
  {
    "slug": "cli-usage",
    "title": "CLI usage",
    "summary": "Non-interactive `archlucid` commands for proof packets, config lint, and support bundles.",
    "audience": "developer",
    "sourcePaths": [
      "docs/library/CLI_USAGE.md"
    ]
  },
  {
    "slug": "configuration-reference",
    "title": "Configuration reference",
    "summary": "Admin task guide for identity/SSO, API keys, and production-like hosting posture, with a collapsed key-catalog appendix. Admin-gated internal runbook.",
    "audience": "developer",
    "sourcePaths": [
      "docs/library/CONFIGURATION_REFERENCE.md"
    ]
  },
  {
    "slug": "engineering-troubleshooting",
    "title": "Engineering troubleshooting runbook",
    "summary": "Admin-only specialty guide for CLI, environment, and log triage. Architects should use Troubleshooting; customers never deep-link here.",
    "audience": "developer",
    "sourcePaths": [
      "docs/runbooks/TROUBLESHOOTING.md",
      "docs/runbooks/COMMON_ERRORS.md"
    ],
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "engineering support and platform triage"
  },
  {
    "slug": "api-contracts",
    "title": "API contracts (technical reference)",
    "summary": "Admin/developer HTTP contract reference — versioned endpoint behavior, auth, and OpenAPI as contract of record. Not buyer governance-approval help.",
    "audience": "developer",
    "sourcePaths": [
      "docs/library/API_CONTRACTS.md"
    ],
    "lastReviewed": "2026-08-10",
    "releaseApplicability": "HTTP contract of record for integrators"
  }
] as const;
