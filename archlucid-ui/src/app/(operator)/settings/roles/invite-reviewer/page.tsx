import { InviteReviewerPageClient } from "../_sections/InviteReviewerPageClient";
import { loadSettingsRolesPageData } from "../_sections/load-settings-roles-page-data";

/** Reviewer-focused invite surface — reuses role management permissions and invite API without generic admin chrome. */
export default async function InviteReviewerPage() {
  const loaded = await loadSettingsRolesPageData();

  return <InviteReviewerPageClient loaded={loaded} />;
}
