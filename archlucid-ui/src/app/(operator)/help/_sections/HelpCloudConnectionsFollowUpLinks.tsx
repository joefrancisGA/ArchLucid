import Link from "next/link";

import {
  CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS,
  type CloudConnectionsHelpFollowUpLink,
} from "@/lib/cloud-connections-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function HelpCloudConnectionsFollowUpLinkItem(props: { readonly link: CloudConnectionsHelpFollowUpLink }): React.ReactElement {
  const { link } = props;

  return (
    <li>
      <Link
        href={link.href}
        className={cn(OPERATOR_LINK.nav, "inline-flex min-h-6 items-center py-1.5 text-[13px]")}
      >
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
