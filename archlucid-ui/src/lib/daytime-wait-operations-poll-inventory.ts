/** DW-005 — UI polls GET /v1/operations/{operationId}, not run progress URLs. */
export const DAYTIME_WAIT_OPERATIONS_POLL_INVENTORY_OWNER = "DW-005" as const;

export const DAYTIME_WAIT_OPERATIONS_POLL_SURFACES: readonly string[] = [
  "archlucid-ui/src/lib/operations/in-flight-operations-store.ts",
  "archlucid-ui/src/lib/api/architecture-request-draft-async-api-poll.ts",
  "archlucid-ui/src/lib/api/architecture-runs-create-async.ts",
  "archlucid-ui/src/lib/system-not-job-in-flight-review-on-desk.ts",
];

export const DAYTIME_WAIT_OPERATIONS_POLL_CONTRACT_ANCHOR =
  "docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md" as const;
