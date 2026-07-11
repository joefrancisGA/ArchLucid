import Link from "next/link";

import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CloudConnectionsProviderHeaderProps = {
  readonly providerLabel: string;
  readonly overview: string;
};

export function CloudConnectionsProviderHeader(props: CloudConnectionsProviderHeaderProps) {
  const { providerLabel, overview } = props;

  return (
    <header className="space-y-2">
      <p className={OPERATOR_TYPOGRAPHY.helper}>
        <Link href={CLOUD_CONNECTIONS_PATH} className={OPERATOR_LINK.nav}>
          Cloud connections
        </Link>
      </p>
      <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{providerLabel}</h1>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{overview}</p>
    </header>
  );
}
