"use client";

import type { TenantSettingsVisibleLoad } from "./load-tenant-settings-page-data";
import { TenantSettingsPageView } from "./TenantSettingsPageView";
import { TenantSettingsRestrictedState } from "./TenantSettingsRestrictedState";
import { useTenantSettingsPage } from "./use-tenant-settings-page";
import { useTenantSettingsShortcuts } from "./use-tenant-settings-shortcuts";

type Props = {
  readonly loaded: TenantSettingsVisibleLoad;
};

export function TenantSettingsPageClient(_props: Props) {
  const model = useTenantSettingsPage();

  useTenantSettingsShortcuts({ enabled: model.isTenantAdmin });

  if (!model.isTenantAdmin) {
    return <TenantSettingsRestrictedState />;
  }

  return <TenantSettingsPageView model={model} />;
}
