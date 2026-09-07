"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { InfrastructureOverviewClient } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_LAYOUT, OPERATOR_LINK } from "@/lib/design-tokens";
import { INTERNAL_PRODUCT_LINE_PATH } from "@/lib/product-line/product-line-catalog";
import {
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_BODY,
  ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE,
  PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL,
} from "@/lib/product-line/product-line-copy";

export function ProductLineHomeSwitch(props: { readonly architectureHome?: ReactNode }): React.JSX.Element {
  const { productLine } = useProductLine();

  if (productLine === "security") {
    return <InfrastructureOverviewClient />;
  }

  if (props.architectureHome !== undefined) {
    return <>{props.architectureHome}</>;
  }

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="architecture-home-security-env-hint">
      <OperatorPageHeader
        title={ARCHITECTURE_HOME_SECURITY_ENV_HINT_TITLE}
        subtitle={ARCHITECTURE_HOME_SECURITY_ENV_HINT_BODY}
        navHref="/"
        headingLevel="h2"
      />
      <Link href={INTERNAL_PRODUCT_LINE_PATH} className={OPERATOR_LINK.inline}>
        {PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL}
      </Link>
    </OperatorPageContainer>
  );
}
