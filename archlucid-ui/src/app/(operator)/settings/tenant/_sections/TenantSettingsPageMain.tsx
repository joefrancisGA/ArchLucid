"use client";

import { TenantSettingsPageView } from "./TenantSettingsPageView";
import { useTenantSettingsPage } from "./use-tenant-settings-page";

export function TenantSettingsPageMain() {
  const model = useTenantSettingsPage();

  if (!model.shouldRenderPage) {
    return null;
  }

  const { shouldRenderPage: _omitShellGuard, ...contentModel } = model;
  void _omitShellGuard;

  return <TenantSettingsPageView model={contentModel} />;
}
