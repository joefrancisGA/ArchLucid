import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";

/**
 * Traffic workbook row ID for Administration System health.
 * Owner backlog shorthand: ADY.
 */
export const ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_ROW_ID = "HXX";

/** Canonical path tracked on the ADY workbook row. */
export const ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_PATH = ADMINISTRATION_SYSTEM_HEALTH_PATH;

/** Workbook Section column value — tenant Administration job, not pre-login marketing. */
export const ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_SECTION = "Admin";

/**
 * Owner workbook Notes for ADY - documents Evidence chrome on System health.
 * ASCII-only for Windows console note scripts.
 */
export const ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_NOTE = "None";

/** Legacy operator bookmark path merged onto ADY during pre-release cleanup. */
export const LEGACY_OPERATOR_SYSTEM_HEALTH_PATH = "/health";
