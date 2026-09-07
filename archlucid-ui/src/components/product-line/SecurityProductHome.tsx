"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  SECURITY_PRODUCT_HOME_SUBTITLE,
  SECURITY_PRODUCT_HOME_TITLE,
} from "@/lib/product-line/product-line-copy";

export function SecurityProductHome(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="security-product-home">
      <OperatorPageHeader
        title={SECURITY_PRODUCT_HOME_TITLE}
        subtitle={SECURITY_PRODUCT_HOME_SUBTITLE}
        navHref="/"
        headingLevel="h2"
      />
    </OperatorPageContainer>
  );
}
