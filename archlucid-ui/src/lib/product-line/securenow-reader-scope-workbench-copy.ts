import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

export const SECURENOW_READER_SCOPE_WORKBENCH_LINE =
  "Cloud findings depend on a Reader role and subscription scope on your Azure connection. SecureNow does not change Azure from this workbench." as const;

export const SECURENOW_READER_SCOPE_WORKBENCH_HREF = CLOUD_CONNECTIONS_PATH;

export const SECURENOW_READER_SCOPE_WORKBENCH_LINK_LABEL = "Azure connections" as const;
