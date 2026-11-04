"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { SecureNowCollectionSetupStatusSection } from "@/components/product-line/SecureNowCollectionSetupStatusSection";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { cn } from "@/lib/utils";

/** SecureNow collection 3/3 posture on home before the first committed review package. */
export function OperatorHomeSecureNowCollectionSetupSection(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (productLine !== "security") {
    return null;
  }

  return (
    <section
      className="space-y-2"
      data-testid="operator-home-securenow-collection-setup"
      aria-labelledby="operator-home-collection-setup-heading"
    >
      <SecureNowCollectionSetupStatusSection testIdPrefix="operator-home" sectionId="operator-home-collection-setup" />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          href={CLOUD_CONNECTIONS_PATH}
          className={OPERATOR_LINK.inline}
          data-testid="operator-home-cloud-connections-link"
        >
          Cloud connections
        </Link>
      </p>
    </section>
  );
}
