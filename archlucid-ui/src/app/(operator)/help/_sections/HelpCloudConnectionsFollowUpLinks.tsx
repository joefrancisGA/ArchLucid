import Link from "next/link";

import {
  cloudConnectionsHelpFollowUpLinks,
  type CloudConnectionsHelpFollowUpLink,
} from "@/lib/cloud-connections-help-guide-content";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { cn } from "@/lib/utils";

function HelpCloudConnectionsFollowUpLinkItem(props: { readonly link: CloudConnectionsHelpFollowUpLink }): React.ReactElement {
  const { link } = props;

  return (
    <li>
      <Link
        href={link.href}
        className={cn(OPERATOR_LINK.nav, "inline-flex min-h-6 items-center py-1.5 text-[13px]")}
      >
        {formatHelpFollowUpLinkAccessibleName(link.href, link.label)}
      </Link>
    </li>
  );
}

/** Doc-aware follow-up links for `/help/cloud-connections` action panel (HCE). */
export function HelpCloudConnectionsFollowUpLinks(): React.ReactElement {
  const followUpLinks = cloudConnectionsHelpFollowUpLinks(resolveProductLineIdFromEnv());

  return (
    <ul className={cn("m-0 flex list-none flex-wrap gap-x-3 gap-y-2 p-0", OPERATOR_TYPOGRAPHY.helper)}>
      {followUpLinks.map((link) => (
        <HelpCloudConnectionsFollowUpLinkItem key={`${link.kind}-${link.href}-${link.label}`} link={link} />
      ))}
    </ul>
  );
}
