import Link from "next/link";

import { HelpCenterDocumentationBadge } from "@/components/help/HelpCenterDocumentationBadge";
import {
  CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS,
  type CloudConnectionsHelpFollowUpLink,
} from "@/lib/cloud-connections-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function HelpCloudConnectionsFollowUpLinkItem(props: { readonly link: CloudConnectionsHelpFollowUpLink }): React.ReactElement {
  const { link } = props;

  if (link.kind === "help") {
    return (
      <li>
        <span className="inline-flex flex-wrap items-center gap-2">
          <HelpCenterDocumentationBadge />
          <Link href={link.href} className={cn(OPERATOR_LINK.inline, "font-medium")}>
            {link.label}
          </Link>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link href={link.href} className={cn(OPERATOR_LINK.inline, "font-medium")}>
        {link.label}
      </Link>
    </li>
  );
}

/** Doc-aware follow-up links for `/help/cloud-connections` action panel (HCE). */
export function HelpCloudConnectionsFollowUpLinks(): React.ReactElement {
  return (
    <ul className={cn("m-0 flex list-none flex-wrap gap-x-3 gap-y-2 p-0", OPERATOR_TYPOGRAPHY.helper)}>
      {CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS.map((link) => (
        <HelpCloudConnectionsFollowUpLinkItem key={`${link.kind}-${link.href}-${link.label}`} link={link} />
      ))}
    </ul>
  );
}
