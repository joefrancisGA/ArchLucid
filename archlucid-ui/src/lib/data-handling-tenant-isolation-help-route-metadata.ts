import type { Metadata } from "next";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";

/**
 * Specialty data-handling + tenant isolation guide — operator help, not a marketing landing page.
 */
export const DATA_HANDLING_TENANT_ISOLATION_HELP_ROUTE_METADATA: Metadata = {
  title: DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  description: DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
