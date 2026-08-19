import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  DIGESTS_HUB_BREADCRUMB_TOPIC_TITLE,
  DIGESTS_SCHEDULE_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/digests-browse-copy";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import type { DigestsHubTabId } from "@/lib/digests-hub-tab";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

export type DigestsHubBreadcrumbProps = {
  readonly activeTab: DigestsHubTabId;
};

/** Review-work trail for the architecture digests hub (ARD / ARS / AIS / ARB). */
export function DigestsHubBreadcrumb(props: DigestsHubBreadcrumbProps): React.JSX.Element {
  const items =
    props.activeTab === "schedule"
      ? [
          { label: OPERATOR_NAV_GROUP_LABELS.reviewWork, href: REVIEWS_LIST_PATH },
          { label: DIGESTS_HUB_BREADCRUMB_TOPIC_TITLE, href: DIGESTS_HUB_PATH },
          { label: DIGESTS_SCHEDULE_BREADCRUMB_TOPIC_TITLE },
        ]
      : [
          { label: OPERATOR_NAV_GROUP_LABELS.reviewWork, href: REVIEWS_LIST_PATH },
          { label: DIGESTS_HUB_BREADCRUMB_TOPIC_TITLE },
        ];

  return <OperatorPageBreadcrumb data-testid="digests-hub-breadcrumb" items={items} />;
}
