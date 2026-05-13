"use client";

import { SettingsRolesPageView } from "./SettingsRolesPageView";
import { useSettingsRolesPage } from "./use-settings-roles-page";

export function SettingsRolesPageMain() {
  const model = useSettingsRolesPage();

  return <SettingsRolesPageView model={model} />;
}
