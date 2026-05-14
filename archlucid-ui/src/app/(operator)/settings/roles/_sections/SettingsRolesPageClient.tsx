"use client";

import type { SettingsRolesPageServerLoad } from "./load-settings-roles-page-data";
import { SettingsRolesPageView } from "./SettingsRolesPageView";
import { useSettingsRolesPage } from "./use-settings-roles-page";

type Props = {
  readonly loaded: SettingsRolesPageServerLoad;
};

export function SettingsRolesPageClient(props: Props) {
  const model = useSettingsRolesPage(props.loaded);

  return <SettingsRolesPageView model={model} />;
}
