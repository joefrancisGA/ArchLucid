"use client";

import type { SettingsRolesPageServerLoad } from "./load-settings-roles-page-data";
import { InviteReviewerPageView } from "./InviteReviewerPageView";
import { useSettingsRolesPage } from "./use-settings-roles-page";

type Props = {
  readonly loaded: SettingsRolesPageServerLoad;
};

export function InviteReviewerPageClient(props: Props) {
  const model = useSettingsRolesPage(props.loaded);

  return <InviteReviewerPageView model={model} />;
}
