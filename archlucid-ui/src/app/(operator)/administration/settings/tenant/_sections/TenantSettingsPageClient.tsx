"use client";

import type { TenantSettingsVisibleLoad } from "./load-tenant-settings-page-data";
import { TenantSettingsPageView } from "./TenantSettingsPageView";
import { useTenantSettingsPage } from "./use-tenant-settings-page";

type Props = {
  readonly loaded: TenantSettingsVisibleLoad;
};

export function TenantSettingsPageClient(props: Props) {
  const model = useTenantSettingsPage(props.loaded);

  return <TenantSettingsPageView model={model} />;
}
